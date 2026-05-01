import { google } from "googleapis";

export async function getHistoricalContext(query: string) {
  try {
    const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").replace(/^"|"$/g, "");
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
    const spreadsheetId = (process.env.GOOGLE_SHEET_ID || "").replace(/^"|"$/g, "");

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn("Credenciais do Google Sheets não configuradas.");
      return "";
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "A:C",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return "";

    // Palavras-chave para busca (simples)
    const keywords = query.toLowerCase().split(" ").filter(w => w.length > 3);
    
    // Filtra chats que contenham as palavras-chave
    const matches = rows.filter(row => {
      const content = (row[2] || "").toLowerCase();
      const title = (row[1] || "").toLowerCase();
      return keywords.some(k => content.includes(k) || title.includes(k));
    });

    // Pega os 3 mais recentes que deram match
    const recentMatches = matches.slice(-3).reverse();

    if (recentMatches.length === 0) {
      // Se não houver match específico, pega apenas os títulos dos últimos 5 para contexto geral
      const lastTitles = rows.slice(-5).map(r => `[${r[0]}] ${r[1]}`).join(", ");
      return `Nenhum histórico específico encontrado para "${query}". Últimos chats arquivados: ${lastTitles}`;
    }

    return recentMatches.map(row => {
      return `--- CHAT ARQUIVADO EM ${row[0]} (Título: ${row[1]}) ---\n${row[2].slice(0, 1000)}...`;
    }).join("\n\n");

  } catch (error) {
    console.error("Erro ao buscar histórico no Sheets:", error);
    return "";
  }
}
