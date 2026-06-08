import { useState } from "react";

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      setError("Password tidak boleh kosong");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      if (!envPassword) {
        // Fallback: check against a default (for dev without env var)
        if (password === "admin123") {
          onLogin();
        } else {
          setError("Password salah!");
        }
      } else {
        if (password === envPassword) {
          onLogin();
        } else {
          setError("Password salah!");
        }
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Masukkan password untuk lanjut</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <a
              href="#"
              onClick={() => { window.location.hash = ""; }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Kembali ke Registrasi
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
