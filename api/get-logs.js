import { google } from "googleapis";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:D",
    });

    const rows = response.data.values || [];
    // Skip header row if it exists
    const dataRows =
      rows.length > 0 && rows[0][0] === "Timestamp" ? rows.slice(1) : rows;

    const logs = dataRows.map((row) => ({
      timestamp: row[0] || "",
      nim: row[1] || "",
      nama: row[2] || "",
      status: row[3] || "HADIR",
    }));

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Google Sheets error:", error);
    return res.status(500).json({ error: error.message });
  }
}
