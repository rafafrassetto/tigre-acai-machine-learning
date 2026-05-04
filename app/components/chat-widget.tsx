"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatWidget() {
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com a API");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
    } catch (error) {
      console.error("Erro ao chamar a IA:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Erro ao processar a mensagem. Verifique o console ou as chaves de API." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md mx-auto border rounded-lg p-4 bg-white shadow-sm">
      {/* Seletor de IA restrito a Gemini e Groq */}
      <div className="mb-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a IA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Padrão)</SelectItem>
            <SelectItem value="llama-3.3-70b-versatile">Groq (Llama 3.3 70B)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Área de mensagens */}
      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10 text-sm">
              Faça uma pergunta sobre o estoque...
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg w-fit max-w-[85%] ${
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-auto rounded-tr-none"
                  : "bg-gray-100 text-gray-800 mr-auto rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg w-fit rounded-tl-none animate-pulse">
              Pensando...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
          placeholder="Digite sua mensagem..."
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}