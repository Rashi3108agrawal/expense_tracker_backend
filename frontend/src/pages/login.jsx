import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigate("/"); // or "/dashboard"
    } catch {
      alert("Login failed");
    }
  };
}
