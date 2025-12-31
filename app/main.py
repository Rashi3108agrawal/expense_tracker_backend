from fastapi import FastAPI, Depends, HTTPException, APIRouter, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

import pandas as pd
from sklearn.ensemble import IsolationForest

from app.database import SessionLocal
from app.models import User, Expense, Budget
from app.schemas import (
    UserCreate, UserLogin,
    ExpenseCreate, BudgetCreate
)

# -------------------------------------------------------------------
# APP SETUP
# -------------------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# -------------------------------------------------------------------
# AUTH CONFIG
# -------------------------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# -------------------------------------------------------------------
# DB DEPENDENCY
# -------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------
# AUTH HELPERS
# -------------------------------------------------------------------

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires: timedelta):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401)

    return user

# -------------------------------------------------------------------
# AUTH ROUTES
# -------------------------------------------------------------------

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(400, "Email already exists")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "Signup successful"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(400, "Invalid credentials")

    token = create_access_token(
        {"sub": str(db_user.id)},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

@app.post("/token")
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password):
        raise HTTPException(401)

    token = create_access_token(
        {"sub": str(user.id)},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

# -------------------------------------------------------------------
# EXPENSES CRUD
# -------------------------------------------------------------------

@app.post("/expenses")
def add_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    new_expense = Expense(**expense.dict(), user_id=user.id)
    db.add(new_expense)
    db.commit()
    return {"message": "Expense added"}

@app.get("/expenses")
def get_expenses(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return (
        db.query(Expense)
        .filter(Expense.user_id == user.id)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user.id
    ).first()

    if not db_expense:
        raise HTTPException(404)

    for k, v in expense.dict().items():
        setattr(db_expense, k, v)

    db.commit()
    return {"message": "Updated"}

@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user.id
    ).first()
    if not expense:
        raise HTTPException(404)

    db.delete(expense)
    db.commit()
    return {"message": "Deleted"}

# -------------------------------------------------------------------
# FILTERS & SEARCH
# -------------------------------------------------------------------

@app.get("/expenses/filter")
def filter_expenses(
    category: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.category == category
    ).all()

@app.get("/expenses/search")
def search(q: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.title.ilike(f"%{q}%")
    ).all()

@app.get("/expenses/by-date")
def by_date(
    start: datetime,
    end: datetime,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.created_at.between(start, end)
    ).all()

# -------------------------------------------------------------------
# SUMMARY & ANALYTICS
# -------------------------------------------------------------------

@app.get("/expenses/summary/monthly")
def monthly_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    total = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user.id,
        extract("year", Expense.created_at) == year,
        extract("month", Expense.created_at) == month
    ).scalar()

    return {"total_expense": float(total)}

@app.get("/analytics/overview")
def analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    if not expenses:
        return {}

    df = pd.DataFrame([{
        "amount": e.amount,
        "category": e.category,
        "date": e.created_at
    } for e in expenses])

    model = IsolationForest(contamination=0.1)
    df["anomaly"] = model.fit_predict(df[["amount"]])

    return {
        "total": float(df["amount"].sum()),
        "by_category": df.groupby("category")["amount"].sum().to_dict(),
        "anomalies": df[df["anomaly"] == -1]["amount"].tolist()
    }

@app.get("/analytics/insights")
def insights(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    if not expenses:
        return {"insights": []}

    df = pd.DataFrame([e.amount for e in expenses], columns=["amount"])
    insights = []

    if df["amount"].mean() > 500:
        insights.append("High average spending detected")

    return {"insights": insights}

# -------------------------------------------------------------------
# BUDGET
# -------------------------------------------------------------------

@app.post("/budget")
def set_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    db.add(Budget(**budget.dict(), user_id=user.id))
    db.commit()
    return {"message": "Budget set"}

@app.get("/budget/status")
def budget_status(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == f"{year}-{month}"
    ).first()

    total = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user.id,
        extract("year", Expense.created_at) == year,
        extract("month", Expense.created_at) == month
    ).scalar()

    return {
        "budget": budget.amount if budget else 0,
        "spent": float(total),
        "remaining": (budget.amount - total) if budget else None
    }

# -------------------------------------------------------------------
# EXTRAS
# -------------------------------------------------------------------

@app.get("/categories")
def categories():
    return ["Food", "Rent", "Travel", "Shopping", "Bills"]

@app.get("/expenses/export")
def export_csv(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()

    df = pd.DataFrame([{
        "Title": e.title,
        "Amount": e.amount,
        "Category": e.category,
        "Date": e.created_at
    } for e in expenses])

    return Response(
        df.to_csv(index=False),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )
