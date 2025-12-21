import api from "./api";

export const getExpenses = async () => {
  const res = await api.get("/expenses");
  return res.data;
};

export const addExpense = async (data) => {
  const res = await api.post("/expenses", data);
  return res.data;
};

export const deleteExpense = async (id) => {
  await api.delete(`/expenses/${id}`);
};
