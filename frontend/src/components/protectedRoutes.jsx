import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setToken(localStorage.getItem("token"));
    } catch {
      setToken(null);
    }
    setLoading(false);
  }, []);

  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
