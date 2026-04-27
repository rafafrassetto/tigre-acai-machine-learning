import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const session = await request.json();

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"), 
      ["https://www.googleapis.com/auth/drive.file"]
    );

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
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || "1hyceUOJrea8dqGawmI8EmGpBio3HEHs1"],
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
    console.error("Erro crítico ao fazer upload no Drive:", error);
    return NextResponse.json({ success: false, error: "Falha no upload do Drive" }, { status: 500 });
  }
}