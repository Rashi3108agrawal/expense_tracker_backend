import { useState, useEffect } from "react";

// Manages predefined + custom categories (stored in localStorage)
export default function CategoryManager({ onChange, value }) {
  const PRESET = ["Food", "Rent", "Travel", "Shopping"];
  const [custom, setCustom] = useState([]);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("categories") || "[]");
    setCustom(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(custom));
  }, [custom]);

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (PRESET.includes(trimmed) || custom.includes(trimmed)) return setNewCat("");
    setCustom((s) => [...s, trimmed]);
    setNewCat("");
  };

  const deleteCategory = (c) => {
    setCustom((s) => s.filter((x) => x !== c));
    if (value === c) onChange("");
  };

  const all = [...PRESET, ...custom];

  return (
    <div style={{ marginBottom: 12 }}>
      <label>Category</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Select category --</option>
        {all.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Add category"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        />
        <button onClick={addCategory}>Add</button>
      </div>

      {custom.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Custom:</strong>
          {custom.map((c) => (
            <div key={c} style={{ display: "inline-block", margin: 6 }}>
              <span>{c}</span>
              <button onClick={() => deleteCategory(c)} style={{ marginLeft: 6 }}>
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
