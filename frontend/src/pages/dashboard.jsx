import { useEffect, useState, useMemo } from "react";
import {
  getExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  filterExpenses,
  getMonthlySummary,
} from "../api/expenses";
import LogoutButton from "../components/logout";
import CategoryManager from "../components/CategoryManager";
import ExportButton from "../components/ExportButton";
import DarkModeToggle from "../components/DarkModeToggle";
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [date, setDate] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  // ADD / UPDATE
 const handleSave = async () => {
  if (!title || !amount || !category)
    return alert("Fill all fields");

  const payload = {
    title,
    amount: Number(amount),
    category,
    created_at: date || undefined,
  };

  if (editId) {
    await updateExpense(editId, payload);
    setEditId(null);
  } else {
    await addExpense(payload);
  }

  setTitle("");
  setAmount("");
  setCategory("");
  loadExpenses();
};

  const handleEdit = (e) => {
  setEditId(e.id);
  setTitle(e.title);
  setAmount(e.amount);
  setCategory(e.category);
  setDate(e.created_at ? e.created_at.split("T")[0] : "");
};


  // FILTER
  const handleFilter = async () => {
    if (!filterCategory) return;
    const data = await filterExpenses(filterCategory);
    setExpenses(data);
    setFilterCategory("");
  };

  const handleSearch = () => {
    setPage(1);
  };

  const applyClientFilters = useMemo(() => {
    let list = [...expenses];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q) ||
          String(e.amount).includes(q)
      );
    }

    if (date) {
      const d1 = new Date(date);
      list = list.filter((e) => new Date(e.created_at) >= d1);
    }
    if (dateTo) {
      const d2 = new Date(dateTo);
      list = list.filter((e) => new Date(e.created_at) <= d2);
    }

    return list;
  }, [expenses, search, date, dateTo]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return applyClientFilters.slice(start, start + limit);
  }, [applyClientFilters, page, limit]);

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return expenses
      .filter((e) => {
        const d = new Date(e.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [expenses]);

  const highestCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const c = e.category || "Uncategorized";
      map[c] = (map[c] || 0) + Number(e.amount || 0);
    });
    let best = null;
    for (const k of Object.keys(map)) {
      if (!best || map[k] > map[best]) best = k;
    }
    return { category: best, amount: map[best] || 0 };
  }, [expenses]);

  // SUMMARY
  const handleSummary = async () => {
    if (!year || !month) {
      alert("Enter year & month");
      return;
    }

    const data = await getMonthlySummary(Number(year), Number(month));
    setSummary(data.total_expense);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "30px auto" }}>
      <h2>My Expenses</h2>

      <LogoutButton />

      {/* ADD / UPDATE */}
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <CategoryManager value={category} onChange={setCategory} />
      <div>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <button onClick={handleSave}>
        {editId ? "Update Expense" : "Add Expense"}
      </button>

      <ExportButton expenses={applyClientFilters} />
      <DarkModeToggle />

      <hr />
      {/* Charts */}
      <div style={{ marginTop: 16 }}>
        <h3>Monthly trend (last 6 months)</h3>
        <LineChart
          points={(() => {
            // compute last 6 months totals
            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const label = `${d.getMonth() + 1}/${d.getFullYear()}`;
              months.push({ d, label, total: 0 });
            }
            expenses.forEach((e) => {
              const dt = new Date(e.created_at);
              for (const m of months) {
                if (dt.getFullYear() === m.d.getFullYear() && dt.getMonth() === m.d.getMonth()) {
                  m.total += Number(e.amount || 0);
                }
              }
            });
            return months.map((m) => ({ x: m.label, y: m.total }));
          })()}
        />

        <h3 style={{ marginTop: 20 }}>Category breakdown</h3>
        <PieChart
          data={(() => {
            const map = {};
            expenses.forEach((e) => {
              const c = e.category || 'Uncategorized';
              map[c] = (map[c] || 0) + Number(e.amount || 0);
            });
            return Object.keys(map).map((k) => ({ label: k, value: map[k] }));
          })()}
        />
      </div>

      {/* FILTER */}
      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Search title/category/amount"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={() => { setSearch(""); setPage(1); }}>Clear</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button onClick={() => { setDate(""); setDateTo(""); setPage(1); }}>Clear Dates</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={() => {
          // today
          const d = new Date();
          const s = d.toISOString().slice(0,10);
          setDate(s); setDateTo(s); setPage(1);
        }}>Today</button>
        <button onClick={() => {
          const d = new Date();
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
          const end = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
          setDate(start); setDateTo(end); setPage(1);
        }}>This month</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Total this month:</strong> ₹{totalThisMonth}
        <div>
          <strong>Highest category:</strong> {highestCategory.category} (₹{highestCategory.amount})
        </div>
      </div>

      <hr />

      {/* MONTHLY SUMMARY */}
      <input
        placeholder="Year (e.g. 2025)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <input
        placeholder="Month (1-12)"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />
      <button onClick={handleSummary}>Load Summary</button>

      {summary !== null && <p>Total Expense: ₹{summary}</p>}

      <hr />

      {/* LIST */}
      <ul>
        {paginated.map((e) => (
          <li key={e.id}>
            {e.created_at && <small>{e.created_at.split("T")[0]} - </small>}
            {e.category} - ₹{e.amount} - {e.title}
            <button onClick={() => handleEdit(e)}>Edit</button>
            <button onClick={async () => { await deleteExpense(e.id); loadExpenses(); }}>Delete</button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page}</span>
        <button onClick={() => setPage((p) => p+1)}>Next</button>
      </div>
    </div>
  );
}
