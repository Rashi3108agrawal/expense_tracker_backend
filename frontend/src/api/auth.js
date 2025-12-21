import api from "./api";

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append("username", email);   // IMPORTANT: username, not email
  params.append("password", password);

  const response = await api.post("/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  localStorage.setItem("token", response.data.access_token);
  return response.data;
};
