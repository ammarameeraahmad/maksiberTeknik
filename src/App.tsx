import { useState, useEffect } from "react";
import RegisterPage from "./pages/RegisterPage";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";

type Page = "register" | "admin-login" | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("register");
  const [adminAuthed, setAdminAuthed] = useState(false);

  // Simple hash-based routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === "#/admin") {
        if (adminAuthed) {
          setPage("admin");
        } else {
          setPage("admin-login");
        }
      } else {
        setPage("register");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [adminAuthed]);

  const handleAdminLogin = () => {
    setAdminAuthed(true);
    setPage("admin");
  };

  const handleAdminLogout = () => {
    setAdminAuthed(false);
    setPage("register");
    window.location.hash = "";
  };

  if (page === "admin-login") {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (page === "admin" && adminAuthed) {
    return <AdminPage onLogout={handleAdminLogout} />;
  }

  return <RegisterPage />;
}
