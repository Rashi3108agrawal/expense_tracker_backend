import api from "./api";

export const addExpense = (data) =>
  api.post("/expenses", data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);

export const getExpenses = async () => {
  const res = await api.get("/expenses");
  return res.data;
};

export const filterExpenses = async (category) => {
  const res = await api.get(`/expenses/filter`, {
    params: { category },
  });
  return res.data;
};

export const getMonthlySummary = async (year, month) => {
  const res = await api.get("/expenses/summary/monthly", {
    params: { year, month },
  });
  return res.data;
};
