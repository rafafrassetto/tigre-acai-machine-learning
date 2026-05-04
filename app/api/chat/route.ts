import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, model } = body;

    if (!message) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    if (model === "gemini-1.5-flash") {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não configurada no .env");
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await geminiModel.generateContent(message);
      const response = await result.response;
      
      return NextResponse.json({ reply: response.text() });
    }

    if (model === "llama-3.3-70b-versatile") {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não configurada no .env");
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: "llama-3.3-70b-versatile",
      });

      return NextResponse.json({ 
        reply: chatCompletion.choices[0]?.message?.content || "Sem resposta do modelo." 
      });
    }

    return NextResponse.json({ error: "Modelo não suportado" }, { status: 400 });

  } catch (error: any) {
    console.error("Erro na API de Chat:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor", details: error.message }, 
      { status: 500 }
    );
  }
}