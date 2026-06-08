# 📋 Panduan Setup Lengkap — Registrasi & Absensi QR

## Arsitektur

- **Frontend**: React + Vite (SPA, di-bundle jadi satu file)
- **Backend**: Vercel Serverless Functions (`/api/log-scan`, `/api/get-logs`)
- **Database**: Google Sheets (via Google Sheets API + Service Account)

---

## 🚀 Langkah 1 — Deploy ke Vercel

1. Push kode ini ke GitHub
2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repo GitHub kamu
4. Biarkan semua setting default → klik **Deploy**

Vercel otomatis akan mendeteksi `api/` folder sebagai serverless functions.

---

## 🔑 Langkah 2 — Set Environment Variable Password Admin

Di Vercel dashboard:
1. Buka project → **Settings** → **Environment Variables**
2. Tambah variable baru:
   - **Name**: `VITE_ADMIN_PASSWORD`
   - **Value**: password yang kamu inginkan (contoh: `rahasia123`)
   - **Environment**: Production (dan Preview jika perlu)
3. Klik **Save**
4. **Redeploy** project agar env var aktif

> ⚠️ Prefix `VITE_` diperlukan agar Vite meng-expose variable ke frontend.

---

## 📊 Langkah 3 — Setup Google Sheets

### 3.1 Buat Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama sheet tab pertama: **Sheet1**
3. Di baris pertama (header), isi kolom:
   - A1: `Timestamp`
   - B1: `NIM`
   - C1: `Nama`
   - D1: `Status`
4. Copy **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[INI_SPREADSHEET_ID]/edit
   ```

### 3.2 Buat Google Cloud Project & Service Account

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project di atas → **New Project**
3. Beri nama project (contoh: `absensi-app`) → **Create**
4. Pastikan project yang baru dibuat sudah dipilih

### 3.3 Aktifkan Google Sheets API

1. Di menu kiri → **APIs & Services** → **Library**
2. Cari `Google Sheets API`
3. Klik → **Enable**

### 3.4 Buat Service Account

1. Di menu kiri → **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** → **Service Account**
3. Isi:
   - **Service account name**: `absensi-bot`
   - **Service account ID**: otomatis terisi
4. Klik **Create and Continue**
5. Di bagian **Grant this service account access to project**:
   - Role: `Editor` (atau `Viewer` jika hanya baca)
6. Klik **Done**

### 3.5 Buat dan Download Key JSON

1. Klik service account yang baru dibuat
2. Tab **Keys** → **Add Key** → **Create new key**
3. Pilih **JSON** → **Create**
4. File JSON akan otomatis terdownload. Simpan baik-baik!

Isi file JSON kira-kira seperti ini:
```json
{
  "type": "service_account",
  "project_id": "absensi-app-123",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "absensi-bot@absensi-app-123.iam.gserviceaccount.com",
  ...
}
```

### 3.6 Share Spreadsheet ke Service Account

1. Buka spreadsheet Google Sheets kamu
2. Klik tombol **Share** (pojok kanan atas)
3. Di kolom "Add people and groups", masukkan **client_email** dari file JSON
   (contoh: `absensi-bot@absensi-app-123.iam.gserviceaccount.com`)
4. Pilih role **Editor**
5. Klik **Send** / **Share**

---

## ⚙️ Langkah 4 — Set Environment Variables di Vercel

Kembali ke Vercel → **Settings** → **Environment Variables**, tambahkan:

### `GOOGLE_CLIENT_EMAIL`
- **Value**: isi dari `client_email` di file JSON
- Contoh: `absensi-bot@absensi-app-123.iam.gserviceaccount.com`

### `GOOGLE_PRIVATE_KEY`
- **Value**: isi dari `private_key` di file JSON
- ⚠️ PENTING: Copy **persis** termasuk `-----BEGIN RSA PRIVATE KEY-----` dan `-----END RSA PRIVATE KEY-----`
- Di Vercel, `\n` dalam private key harus tetap sebagai `\n` (bukan newline sungguhan)
- Contoh format di Vercel:
  ```
  -----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAK...\n-----END RSA PRIVATE KEY-----\n
  ```

### `GOOGLE_SPREADSHEET_ID`
- **Value**: ID spreadsheet dari URL
- Contoh: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

Setelah semua env var diset → klik **Redeploy** di tab **Deployments**.

---

## ✅ Verifikasi

1. Buka URL Vercel kamu
2. Isi form registrasi → generate QR
3. Buka `/admin` (atau klik link "Admin Panel →")
4. Login dengan password yang sudah di-set
5. Scan QR → cek apakah data muncul di Google Sheets

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Google Sheets belum dikonfigurasi" | Pastikan 3 env var Google sudah di-set dan sudah redeploy |
| `invalid_grant` error | Pastikan `GOOGLE_PRIVATE_KEY` mengandung `\n` bukan newline sungguhan |
| Scan QR tidak merespons | Pastikan kamera diberi izin di browser |
| QR tidak terbaca | Pastikan cahaya cukup, jarak kamera sesuai |
| Data tidak muncul di Sheets | Pastikan spreadsheet sudah di-share ke `client_email` |

---

## 📁 Struktur File

```
├── api/
│   ├── log-scan.js      # POST: Tambah baris ke Sheets
│   └── get-logs.js      # GET: Ambil semua log dari Sheets
├── src/
│   ├── pages/
│   │   ├── RegisterPage.tsx  # Halaman registrasi + generate QR
│   │   ├── AdminLogin.tsx    # Halaman login admin
│   │   └── AdminPage.tsx     # Halaman admin (scan + log)
│   └── App.tsx               # Router utama
├── vercel.json               # Konfigurasi routing Vercel
└── .env.example              # Contoh environment variables
```

---

## 🔗 Navigasi

- `/` atau `/#` → Halaman Registrasi
- `/#/admin` → Admin Panel (perlu login)
