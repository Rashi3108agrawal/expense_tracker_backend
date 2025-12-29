import { useEffect, useState } from "react";
import api from "../api/api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/me");
        setUser(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "30px auto" }}>
      <h2>Profile</h2>
      <p>
        <strong>Name:</strong> {user.name}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
    </div>
  );
}
