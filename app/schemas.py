from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str

class BudgetCreate(BaseModel):
    month: int
    amount: float
