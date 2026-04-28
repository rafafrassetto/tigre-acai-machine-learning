import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const session = await request.json();

    const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || "").replace(/^"|"$/g, "");
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
    const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || "").replace(/^"|"$/g, "");

    if (!clientEmail || !privateKey || !folderId) {
      return NextResponse.json({ success: false, error: "Credenciais ausentes" }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    let fileContent = `==================================================\n`;
    fileContent += `    RELATÓRIO DE ATENDIMENTO IA - TIGRE AÇAÍ\n`;
    fileContent += `==================================================\n\n`;
    fileContent += `Tópico: ${session.title}\n`;
    fileContent += `Data do Backup: ${new Date().toLocaleString('pt-BR')}\n`;
    fileContent += `--------------------------------------------------\n\n`;

    session.messages.forEach((msg: any) => {
      const roleName = msg.role === "user" ? "USUÁRIO" : "ASSISTENTE IA";
      const cleanMsg = msg.content.replace(/\*\*(.*?)\*\*/g, '$1');
      fileContent += `[${roleName}]:\n${cleanMsg}\n\n`;
    });

    const fileMetadata = {
      name: `Backup_${session.title.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 30)}_${Date.now()}.txt`,
      parents: [folderId],
    };

    const media = {
      mimeType: "text/plain",
      body: fileContent,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });

    return NextResponse.json({ success: true, fileId: response.data.id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Falha no upload do Drive" }, { status: 500 });
  }
}