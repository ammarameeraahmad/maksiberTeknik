import { google } from "googleapis";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nim, nama, timestamp } = req.body;

  if (!nim || !nama) {
    return res.status(400).json({ error: "nim and nama are required" });
  }

  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!privateKey || !clientEmail || !spreadsheetId) {
      return res
        .status(500)
        .json({ error: "Google Sheets environment variables not configured" });
    }

    const auth = new google.auth.JWT(clientEmail, null, privateKey, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);

    const sheets = google.sheets({ version: "v4", auth });

    const scanTime =
      timestamp ||
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        majorDimension: "ROWS",
        values: [[scanTime, nim, nama, "HADIR"]],
      },
    });

    return res.status(200).json({ success: true, message: "Data logged successfully" });
  } catch (error) {
    console.error("Google Sheets error:", error);
    return res.status(500).json({ error: error.message });
  }
}
