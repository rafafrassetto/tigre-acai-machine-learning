import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const session = await request.json();

    const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").replace(/^"|"$/g, "");
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
    const spreadsheetId = (process.env.GOOGLE_SHEET_ID || "").replace(/^"|"$/g, "");

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json({ success: false, error: "Credenciais ausentes" }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    let chatContent = "";
    session.messages.forEach((msg: any) => {
      const roleName = msg.role === "user" ? "USUÁRIO" : "ASSISTENTE IA";
      const cleanMsg = msg.content.replace(/\*\*(.*?)\*\*/g, '$1');
      chatContent += `[${roleName}]:\n${cleanMsg}\n\n`;
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [new Date().toLocaleString('pt-BR'), session.title, chatContent]
        ],
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Falha no Sheets" }, { status: 500 });
  }
}