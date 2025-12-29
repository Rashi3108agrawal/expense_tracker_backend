import api from "./api";

export const signup = async(data) => {
  const res = await api.post("/signup", data);
  localStorage.setItem("token", res.data.access_token);
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post("/login", {
    email,
    password,
  });

  // store token
  localStorage.setItem("token", res.data.access_token);
  return res.data;
};
