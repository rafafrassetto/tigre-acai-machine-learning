"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, User, Loader2 } from "lucide-react"
import type { Produto, Movimentacao } from "../page"

interface ChatWidgetProps {
  produtos: Produto[]
  movimentacoes: Movimentacao[]
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatWidget({ produtos, movimentacoes }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou seu assistente de IA. Como posso ajudar com a gestão de estoque hoje?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getResumoEstoque = () => {
    return produtos.map(p => ({
      nome: p.nome,
      categoria: p.categoria,
      estoqueAtual: p.quantidadeEstoque,
      unidade: p.unidadeMedida,
      pontoReposicao: p.pontoReposicao,
      status: p.quantidadeEstoque <= p.pontoReposicao ? "BAIXO" : "NORMAL"
    }))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1), 
          estoqueContext: getResumoEstoque(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.response }])
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Desculpe, ocorreu um erro ao consultar a IA." }])
      }
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "Erro de conexão com o servidor." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 300)
  }

  if (!isOpen && !isClosing) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-full p-0 bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-transform hover:scale-105"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* OVERLAY ESCURO COM OPACIDADE E BLUR */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 transition-opacity duration-100 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* PAINEL DO CHAT */}
      <div 
        className={`fixed top-0 right-0 h-screen w-full sm:w-[30vw] min-w-[400px] flex flex-col shadow-2xl z-50 bg-gray-50 transition-all duration-300 ease-in-out ${
          isClosing ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right"
        }`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 z-10" />
        
        {/* Adicionado pt-8 para compensar a falta do header e dar um respiro no topo */}
        <div className="flex-1 overflow-y-auto p-4 pt-8 space-y-6 bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user" ? "bg-slate-800" : "bg-gradient-to-br from-blue-100 to-purple-100 border border-purple-200"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                </div>

                <div className={`p-3 px-4 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user" 
                    ? "bg-slate-800 text-white rounded-tr-none" 
                    : "bg-white border border-gray-100 rounded-tl-none text-gray-800"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border border-purple-200 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="p-3 px-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none flex items-center text-gray-500 text-sm gap-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" /> Pensando...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 p-4 bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre o estoque..."
              disabled={isLoading}
              className="flex-1 pr-12 h-12 rounded-full border-gray-300 focus-visible:ring-purple-300 shadow-sm bg-white"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}