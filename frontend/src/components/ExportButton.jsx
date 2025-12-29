export default function ExportButton({ expenses }) {
  const downloadCSV = () => {
    if (!expenses || expenses.length === 0) return alert("No expenses to export");
    const headers = ["id", "title", "amount", "category", "created_at"];
    const rows = expenses.map((e) => headers.map((h) => JSON.stringify(e[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={downloadCSV}>Export CSV</button>;
}
