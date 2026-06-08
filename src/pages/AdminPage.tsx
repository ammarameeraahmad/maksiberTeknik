import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ScanLog {
  timestamp: string;
  nim: string;
  nama: string;
  status: string;
}

interface Props {
  onLogout: () => void;
}

export default function AdminPage({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"scan" | "log">("scan");
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [scannedNIMs, setScannedNIMs] = useState<Set<string>>(new Set());
  const [lastScan, setLastScan] = useState<{ nim: string; nama: string; status: "success" | "duplicate" | "error"; message: string } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [sheetsConfigured, setSheetsConfigured] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const scannerDivId = "qr-scanner-container";

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await fetch("/api/get-logs");
      if (!res.ok) {
        const data = await res.json();
        if (data.error?.includes("not configured")) {
          setSheetsConfigured(false);
        }
        throw new Error(data.error || "Gagal memuat log");
      }
      const data = await res.json();
      setLogs(data.logs || []);
      // Build set of scanned NIMs from existing logs
      const nimSet = new Set<string>(
        (data.logs || []).map((l: ScanLog) => l.nim)
      );
      setScannedNIMs(nimSet);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLogsError(err.message);
      } else {
        setLogsError("Gagal memuat log");
      }
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      isScanningRef.current = false;
      setScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setLastScan(null);
    setScanning(true);
    isScanningRef.current = true;

    // Small delay to ensure DOM element is rendered
    await new Promise((r) => setTimeout(r, 100));

    try {
      const html5QrCode = new Html5Qrcode(scannerDivId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Pause scanning while processing
          if (!isScanningRef.current) return;
          isScanningRef.current = false;

          try {
            const payload = JSON.parse(decodedText);
            const { nim, nama } = payload;

            if (!nim || !nama) {
              setLastScan({ nim: "", nama: "", status: "error", message: "QR tidak valid, format salah." });
              await stopScanner();
              return;
            }

            // Check duplicate
            if (scannedNIMs.has(nim)) {
              setLastScan({ nim, nama, status: "duplicate", message: `${nama} (${nim}) sudah absen sebelumnya!` });
              await stopScanner();
              return;
            }

            // Log to Google Sheets
            const timestamp = new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            try {
              const res = await fetch("/api/log-scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nim, nama, timestamp }),
              });

              if (!res.ok) {
                const errData = await res.json();
                if (errData.error?.includes("not configured")) {
                  setSheetsConfigured(false);
                }
                // Still mark as scanned locally even if sheets fails
              }
            } catch {
              // Sheets error - still log locally
            }

            // Update local state
            setScannedNIMs((prev) => new Set([...prev, nim]));
            const timestamp2 = new Date().toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            setLogs((prev) => [{ timestamp: timestamp2, nim, nama, status: "HADIR" }, ...prev]);
            setLastScan({ nim, nama, status: "success", message: `✅ ${nama} berhasil diabsen!` });
          } catch {
            setLastScan({ nim: "", nama: "", status: "error", message: "QR tidak valid atau bukan QR absensi." });
          }

          await stopScanner();
        },
        () => {
          // QR not found yet - ignore
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScanning(false);
      isScanningRef.current = false;
    }
  }, [scannedNIMs, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Stop scanner when switching tabs
  useEffect(() => {
    if (activeTab !== "scan" && scanning) {
      stopScanner();
    }
  }, [activeTab, scanning, stopScanner]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-slate-800">Admin Panel</span>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </nav>

      {/* Sheets warning */}
      {!sheetsConfigured && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-yellow-800 text-xs text-center max-w-2xl mx-auto">
            ⚠️ Google Sheets belum dikonfigurasi. Data absensi hanya tersimpan secara lokal di session ini.
            <a href="#setup" className="underline ml-1">Lihat cara setup →</a>
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "scan"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            📷 Scan QR
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "log"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            📋 Log Absensi ({logs.length})
          </button>
        </div>

        {/* Scan Tab */}
        {activeTab === "scan" && (
          <div className="space-y-4">
            {/* Last scan result */}
            {lastScan && (
              <div
                className={`rounded-xl p-4 border ${
                  lastScan.status === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : lastScan.status === "duplicate"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <p className="font-semibold text-sm">{lastScan.message}</p>
                {lastScan.nim && (
                  <p className="text-xs mt-1 opacity-75">NIM: {lastScan.nim}</p>
                )}
              </div>
            )}

            {/* Scanner */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Scanner viewport */}
              <div className="relative bg-slate-900" style={{ minHeight: 320 }}>
                <div
                  id={scannerDivId}
                  className="w-full"
                  style={{ minHeight: 320 }}
                />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                    <div className="text-6xl opacity-30">📷</div>
                    <p className="text-slate-400 text-sm">Kamera tidak aktif</p>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📷</span> Mulai Scan QR
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⏹</span> Stop Scanner
                  </button>
                )}

                <p className="text-xs text-center text-slate-400">
                  Arahkan kamera ke QR Code peserta
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-blue-600">{logs.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total Hadir</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-3xl font-bold text-green-600">
                  {lastScan?.status === "success" ? "✓" : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Terakhir Scan</p>
              </div>
            </div>
          </div>
        )}

        {/* Log Tab */}
        {activeTab === "log" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Data Absensi</h2>
              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                {loadingLogs ? "⏳" : "🔄"} Refresh
              </button>
            </div>

            {logsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                ⚠️ {logsError}
              </div>
            )}

            {loadingLogs ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400">Memuat data...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-slate-400 text-sm">Belum ada data absensi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="bg-slate-100 rounded-lg px-4 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Nama</span>
                  <span className="col-span-4">NIM</span>
                  <span className="col-span-2">Status</span>
                </div>

                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <div className="col-span-5">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {log.nama}
                        </p>
                        <p className="text-xs text-slate-400">{log.timestamp}</p>
                      </div>
                      <p className="col-span-4 text-xs font-mono text-slate-600 truncate">
                        {log.nim}
                      </p>
                      <span className="col-span-2">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {log.status || "HADIR"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
