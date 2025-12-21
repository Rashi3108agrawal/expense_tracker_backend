import { useEffect, useState } from "react";
import { getExpenses, addExpense, deleteExpense } from "../api/expenses";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
  try {
    const data = await getExpenses();
    setExpenses(data);
  } catch (err) {
    console.error("Failed to load expenses", err);
    alert("Session expired. Please login again.");
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
};


  const handleAdd = async () => {
    await addExpense({ amount, category });
    setAmount("");
    setCategory("");
    loadExpenses();
  };

  return (
    <div>
      <h2>My Expenses</h2>

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <button onClick={handleAdd}>Add</button>

      <ul>
        {expenses.map((e) => (
          <li key={e.id}>
            {e.category} - ₹{e.amount}
            <button onClick={() => deleteExpense(e.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
}


// localStorage.removeItem("token");
// window.location.href = "/login";
