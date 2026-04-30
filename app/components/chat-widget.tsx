"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, User, Loader2, Trash2, MessageSquare, Plus, ArrowLeft, Clock, Download, Edit2, Check, X, Bot, Cpu } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMongoSync } from "../hooks/use-mongo-sync"
import type { Produto, Movimentacao, Fornecedor } from "../page"

interface ChatWidgetProps {
  produtos: Produto[]
  setProdutos?: (produtos: Produto[]) => void
  movimentacoes: Movimentacao[]
  fornecedores: Fornecedor[]
}


interface Message {
  role: "user" | "assistant"
  content: string
  actionPending?: {
    type: "INSERIR_PRODUTO" | "REMOVER_PRODUTO"
    payload: any
    status: "pending" | "confirmed" | "cancelled"
  }
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}

const INITIAL_MESSAGE: Message = { 
  role: "assistant", 
  content: "Olá! Sou o 🐯 Tigre IA. Como posso ajudar você hoje?" 
const AVAILABLE_MODELS = [
  // --- Elite (Top Tier 2026) ---
  { id: "claude-4-7-opus-2026", name: "Claude 4.7 Opus", description: "O rei da lógica e codificação" },
  { id: "gpt-5.5-preview", name: "GPT-5.5 Ultra", description: "Líder em automação e agentes" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", description: "Contexto massivo (2M tokens)" },
  
  // --- Alta Performance ---
  { id: "claude-4-6-sonnet-2026", name: "Claude 4.6 Sonnet", description: "Equilíbrio perfeito de inteligência" },
  { id: "gpt-4o", name: "GPT-4o (Omni)", description: "Rápido e multimodal" },
  { id: "llama-3.1-405b-reasoning", name: "Llama 3.1 405B", description: "O gigante open-source" },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B", description: "Especialista em raciocínio" },
  
  // --- Versáteis e Rápidos ---
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Potente e versátil" },
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B", description: "Excelente lógica" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Rápido com contexto longo" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Velocidade clássica" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Respostas imediatas" },
]
tion: "Leve" },
]

export function ChatWidget({ produtos, setProdutos, movimentacoes, fornecedores }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [view, setView] = useState<"history" | "chat">("history")
  
  const [sessions, setSessions] = useMongoSync<ChatSession[]>("historico_chats", [])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, view])

  const getContextoIA = () => {
    return {
      produtos: produtos.map(p => {
        const fornecedorVinculado = fornecedores.find(f => f.id === p.fornecedorId)
        return {
          nome: p.nome,
          categoria: p.categoria,
          estoqueAtual: p.quantidadeEstoque,
          unidade: p.unidadeMedida,
          custoUnitario: p.custoUnitario,
          pontoReposicao: p.pontoReposicao,
          nomeFornecedor: fornecedorVinculado ? fornecedorVinculado.nome : "Sem fornecedor",
          status: p.quantidadeEstoque <= p.pontoReposicao ? "BAIXO" : "NORMAL"
        }
      }),
      fornecedores: fornecedores.map(f => ({
        nome: f.nome,
        telefone: f.telefone || "Não cadastrado",
        cnpj: f.cnpj || "Não cadastrado",
        condicoesPagamento: f.condicoesPagamento || "Não informado",
        observacoes: f.observacoes || "Nenhuma"
      })),
      ultimasMovimentacoes: movimentacoes
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10)
        .map(mov => {
          const prod = produtos.find(p => p.id === mov.produtoId)
          return {
            produto: prod ? prod.nome : "Produto excluído",
            tipo: mov.tipo,
            quantidade: mov.quantidade,
            data: new Date(mov.data).toLocaleString("pt-BR")
          }
        })
    }
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([INITIAL_MESSAGE])
    setView("chat")
  }

  const handleSelectSession = (id: string) => {
    if (editingSessionId) return
    const session = sessions.find(s => s.id === id)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      setView("chat")
    }
  }

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    
    const sessionToBackup = sessions.find(s => s.id === id);

    const updatedSessions = sessions.filter(s => s.id !== id)
    setSessions(updatedSessions)
    
    if (currentSessionId === id) {
      setCurrentSessionId(null)
      setMessages([INITIAL_MESSAGE])
      setView("history")
    }

    if (sessionToBackup) {
      fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionToBackup)
      }).then(res => {
        if (!res.ok) console.error("Falha ao salvar no Google Drive");
      }).catch(err => {
        console.error("Erro de conexão no backup:", err);
      });
    }
  }

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
  }

  const saveEdit = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation()
    if (editingTitle.trim()) {
      setSessions(sessions.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s))
    }
    setEditingSessionId(null)
    setEditingTitle("")
  }

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(null)
    setEditingTitle("")
  }

  const handleExportPDF = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const formatHTMLMessage = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>')
    }

    const content = session.messages.map(msg => `
      <div style="margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="font-weight: bold; margin-bottom: 5px; color: ${msg.role === 'user' ? '#1e293b' : '#7e22ce'};">
          ${msg.role === 'user' ? 'Usuário' : 'Assistente IA'}
        </div>
        <div style="padding: 12px; border-radius: 8px; background-color: ${msg.role === 'user' ? '#f1f5f9' : '#f3e8ff'}; border: 1px solid ${msg.role === 'user' ? '#e2e8f0' : '#e9d5ff'}; line-height: 1.5;">
          ${formatHTMLMessage(msg.content)}
        </div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Chat - Tigre Açaí</title>
          <meta charset="utf-8">
        </head>
        <body style="padding: 40px; max-width: 800px; margin: 0 auto; color: #333;">
          <div style="border-bottom: 2px solid #e2e8f0; margin-bottom: 30px; padding-bottom: 20px;">
            <h1 style="font-family: system-ui, sans-serif; color: #0f172a; margin: 0 0 10px 0;">Relatório de Atendimento IA</h1>
            <p style="font-family: system-ui, sans-serif; color: #64748b; margin: 0; line-height: 1.6;">
              <strong>Tópico:</strong> ${session.title}<br/>
              <strong>Data:</strong> ${new Date(session.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          ${content}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleConfirmAction = (messageIndex: number, action: NonNullable<Message["actionPending"]>) => {
    if (!setProdutos) return;
    
    let novoTexto = "";
    if (action.type === "INSERIR_PRODUTO") {
      setProdutos([...produtos, action.payload]);
      novoTexto = `✅ Produto **${action.payload.nome}** inserido com sucesso! A tabela já foi atualizada.`;
    } else if (action.type === "REMOVER_PRODUTO") {
      const regex = new RegExp(action.payload.nome, "i");
      const filtered = produtos.filter(p => !regex.test(p.nome));
      const removedCount = produtos.length - filtered.length;
      setProdutos(filtered);
      novoTexto = `🗑️ Foram removidos **${removedCount}** produto(s) correspondente(s) a "${action.payload.nome}".`;
    }

    const updatedMessages = [...messages];
    updatedMessages[messageIndex].actionPending = { ...action, status: "confirmed" };
    updatedMessages.push({ role: "assistant", content: novoTexto });
    setMessages(updatedMessages);

    if (currentSessionId) {
      setSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, updatedAt: Date.now() } : s));
    }
  }

  const handleCancelAction = (messageIndex: number) => {
    const updatedMessages = [...messages];
    const action = updatedMessages[messageIndex].actionPending;
    if (action) {
      updatedMessages[messageIndex].actionPending = { ...action, status: "cancelled" };
      updatedMessages.push({ role: "assistant", content: "❌ Ação cancelada pelo usuário." });
      setMessages(updatedMessages);

      if (currentSessionId) {
        setSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, updatedAt: Date.now() } : s));
      }
    }
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
          estoqueContext: getContextoIA(),
          model: selectedModel
        }),
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        data = { response: "⚠️ Resposta inválida do servidor. Tente novamente." }
      }

      const aiResponse = data.response || data.error || "⚠️ Resposta inesperada do servidor."
      
      const newAssistantMessage: Message = { role: "assistant", content: aiResponse }
      if (data.actionPending) {
        newAssistantMessage.actionPending = { ...data.actionPending, status: "pending" }
      }
      
      const finalMessages: Message[] = [...newMessages, newAssistantMessage]
      setMessages(finalMessages)

      const now = Date.now()
      if (currentSessionId) {
        setSessions(sessions.map(s => 
          s.id === currentSessionId ? { ...s, messages: finalMessages, updatedAt: now } : s
        ))
      } else {
        const newId = now.toString()
        setCurrentSessionId(newId)
        const title = userMessage.length > 35 ? userMessage.substring(0, 35) + "..." : userMessage
        const newSession: ChatSession = { id: newId, title, messages: finalMessages, updatedAt: now }
        setSessions([newSession, ...sessions])
      }
    } catch (error) {
      console.error("Erro de conexão com a API:", error)
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Erro de conexão com o servidor. Verifique sua internet e tente novamente." }])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  if (!isOpen && !isClosing) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
        <Button onClick={() => { setView("history"); setIsOpen(true); }} className="relative h-14 w-14 rounded-full p-0 bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 transition-opacity duration-100 ${isClosing ? "opacity-0" : "opacity-100"}`} onClick={() => { setIsClosing(true); setTimeout(() => { setIsOpen(false); setIsClosing(false); }, 300); }} />

      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[30vw] min-w-[400px] flex flex-col shadow-2xl z-50 bg-gray-50 transition-all duration-300 ${isClosing ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right"}`}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 z-30" />
        
        <div className="shrink-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-20">
          {view === "chat" ? (
            <>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView("history")} className="text-white hover:bg-slate-800">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="hidden sm:block">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[180px] h-9 bg-slate-800 border-slate-700 text-white text-xs overflow-hidden">
                      <div className="flex items-center gap-2 max-w-full overflow-hidden">
                        <Cpu className="h-3 w-3 text-purple-400 shrink-0" />
                        <div className="truncate flex-1 text-left">
                          <SelectValue placeholder="Modelo" />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {AVAILABLE_MODELS.map(model => (
                        <SelectItem 
                          key={model.id} 
                          value={model.id} 
                          className="text-xs hover:bg-slate-800 focus:bg-slate-800 focus:text-white data-[highlighted]:bg-slate-800 data-[highlighted]:text-white cursor-pointer"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-inherit">{model.name}</span>
                            <span className="text-[10px] text-gray-400 group-focus:text-gray-300">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <div className="font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" /> Histórico
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleNewChat} className="text-white hover:bg-slate-800">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {view === "history" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p>Nenhuma conversa encontrada.</p>
                <Button onClick={handleNewChat} variant="outline">Nova Conversa</Button>
              </div>
            ) : (
              [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
                <div key={session.id} onClick={() => handleSelectSession(session.id)} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-purple-300 group transition-all">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-slate-600" />
                    </div>
                    {editingSessionId === session.id ? (
                      <div className="flex-1 mr-2 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(e, session.id)
                            if (e.key === 'Escape') cancelEdit(e)
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 shrink-0" onClick={(e) => saveEdit(e, session.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 shrink-0" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-hidden flex-1">
                        <div className="font-medium text-gray-800 truncate text-sm">{session.title}</div>
                        <div className="text-xs text-gray-400">{new Date(session.updatedAt).toLocaleString("pt-BR")}</div>
                      </div>
                    )}
                  </div>
                  {editingSessionId !== session.id && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-purple-500 hover:bg-purple-50 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => startEditing(e, session)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => handleExportPDF(e, session)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => handleDeleteSession(e, session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-800" : "bg-gradient-to-br from-blue-100 to-purple-100"}`}>
                      {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className={`p-3 px-4 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-none" : "bg-white border text-gray-800 rounded-tl-none"}`}>
                      {formatMessage(msg.content)}
                      
                      {msg.actionPending && (
                        <div className="mt-4 p-4 border rounded-xl bg-gray-50 border-purple-200">
                          <div className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> 
                            {msg.actionPending.type === "INSERIR_PRODUTO" ? "Inserir Produto" : "Remover Produto"}
                          </div>
                          
                          <div className="text-xs space-y-1 mb-4 text-gray-600 bg-white p-3 rounded border">
                            {msg.actionPending.type === "INSERIR_PRODUTO" ? (
                              <>
                                <div><strong>Nome:</strong> {msg.actionPending.payload.nome}</div>
                                <div><strong>Categoria:</strong> {msg.actionPending.payload.categoria}</div>
                                <div><strong>Quantidade:</strong> {msg.actionPending.payload.quantidadeEstoque} {msg.actionPending.payload.unidadeMedida}</div>
                                <div><strong>Custo:</strong> R$ {msg.actionPending.payload.custoUnitario}</div>
                              </>
                            ) : (
                              <div><strong>Produto alvo:</strong> {msg.actionPending.payload.nome}</div>
                            )}
                          </div>

                          {msg.actionPending.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleConfirmAction(index, msg.actionPending!)} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                                Confirmar Ação
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancelAction(index)} className="flex-1">
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className={`text-center font-medium text-xs py-2 rounded-lg ${msg.actionPending.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {msg.actionPending.status === 'confirmed' ? 'Ação Confirmada' : 'Ação Cancelada'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Sparkles className="h-4 w-4 text-purple-600" /></div>
                    <div className="p-3 px-4 bg-white border rounded-2xl flex items-center text-gray-500 text-sm gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte sobre o estoque..." disabled={isLoading} className="flex-1 pr-12 h-12 rounded-full bg-gray-50" />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="absolute right-2 top-2 h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}