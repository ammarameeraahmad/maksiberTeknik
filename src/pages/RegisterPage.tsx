import { useState, useRef } from "react";
import QRCode from "qrcode";

export default function RegisterPage() {
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    if (!nama.trim() || !nim.trim()) {
      setError("Nama dan NIM harus diisi!");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // QR data: JSON with nim and nama
      const qrPayload = JSON.stringify({ nim: nim.trim(), nama: nama.trim() });
      const url = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(url);
    } catch (err) {
      setError("Gagal membuat QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `QR_${nim.trim()}_${nama.trim()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleReset = () => {
    setQrDataUrl(null);
    setNama("");
    setNim("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-1">Registrasi</h1>
          <p className="text-slate-500 text-sm">
            Masukkan data untuk membuat QR Code absensi
          </p>
        </div>

        {!qrDataUrl ? (
          /* Form */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nawa Rizki Darmawan"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                NIM
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="25/566364/TK/63890"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Membuat QR...
                </>
              ) : (
                <>🔲 Generate QR</>
              )}
            </button>

            <div className="pt-2 border-t border-slate-100">
              <a
                href="#/admin"
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Admin Panel →
              </a>
            </div>
          </div>
        ) : (
          /* QR Result */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800">{nama}</h2>
              <p className="text-slate-500 text-sm font-mono">{nim}</p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-inner">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Tunjukkan QR ini saat absensi kepada admin
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
              >
                ⬇️ Download QR
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors duration-200"
              >
                🔄 Buat Baru
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <a
                href="#/admin"
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Admin Panel →
              </a>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
