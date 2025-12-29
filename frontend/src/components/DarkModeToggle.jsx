import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem("darkmode") === "1"
  );

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkmode", dark ? "1" : "0");
  }, [dark]);

  return (
    <button onClick={() => setDark((d) => !d)}>
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
