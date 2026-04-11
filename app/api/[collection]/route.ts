import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"

// Inicializa o SDK do Gemini (certifique-se de ter o arquivo .env.local configurado)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params
    
    if (collection === "chat") {
      return NextResponse.json([])
    }

    const client = await clientPromise
    const db = client.db("tigre_acai")
    const data = await db.collection(collection).find({}).toArray()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json([])
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params
    const body = await request.json()

    // ==========================================
    // LÓGICA DO CHAT IA (GEMINI)
    // ==========================================
    if (collection === "chat") {
      const { message, history, estoqueContext } = body

      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Chave de API não configurada." }, { status: 500 })
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `Você é um assistente virtual integrado a um sistema de gerenciamento de estoque de uma açaiteria/sorveteria. 
        
        Você tem DOIS modos de agir:
        
        MODO 1 - CONVERSA: Se o usuário fizer uma pergunta, responda de forma amigável usando os dados do estoque:
        DADOS: ${JSON.stringify(estoqueContext)}
        
        MODO 2 - INSERÇÃO DE PRODUTO: Se o usuário pedir para CADASTRAR, REGISTRAR, ADICIONAR ou INSERIR um novo produto ou quantidade (Ex: "Registrar sorvete de morango 15 litros"), você NÃO deve responder com texto normal. 
        Você DEVE responder EXATAMENTE e APENAS com um objeto JSON válido, seguindo estritamente esta interface:
        
        {
          "acao": "INSERIR_PRODUTO",
          "produto": {
            "nome": "Nome deduzido",
            "categoria": "sorvete",
            "quantidadeEstoque": 15,
            "unidadeMedida": "Litros",
            "custoUnitario": 0,
            "fornecedorId": "",
            "pontoReposicao": 5,
            "observacoes": "Cadastrado via IA"
          }
        }
        
        Atenção: No MODO 2, não escreva NENHUM texto antes ou depois do JSON. Não use crases (\`\`\`).`
      })

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }))

      const chat = model.startChat({ history: formattedHistory })
      const result = await chat.sendMessage(message)
      let responseText = result.response.text()

      // ----------------------------------------------------
      // PASSO 1: Tentar ler o JSON de forma isolada
      // ----------------------------------------------------
      let iaCommand = null;
      try {
        const cleanJsonString = responseText.replace(/```json\n?|\n?```/g, '').trim()
        if (cleanJsonString.startsWith('{') && cleanJsonString.includes('"acao"')) {
          iaCommand = JSON.parse(cleanJsonString)
        }
      } catch (parseError) {
        // Não é JSON ou o JSON veio quebrado, a vida segue e responseText é enviado como texto normal.
      }

      // ----------------------------------------------------
      // PASSO 2: Executar no Banco de Dados (se for um comando)
      // ----------------------------------------------------
      if (iaCommand && iaCommand.acao === "INSERIR_PRODUTO" && iaCommand.produto) {
        try {
          const client = await clientPromise
          const db = client.db("tigre_acai")
          
          const novoProduto = {
            id: Date.now().toString(),
            nome: iaCommand.produto.nome || "Produto sem nome",
            categoria: iaCommand.produto.categoria || "sorvete",
            quantidadeEstoque: Number(iaCommand.produto.quantidadeEstoque) || 0,
            unidadeMedida: iaCommand.produto.unidadeMedida || "Unidades",
            custoUnitario: Number(iaCommand.produto.custoUnitario) || 0,
            fornecedorId: iaCommand.produto.fornecedorId || "",
            pontoReposicao: Number(iaCommand.produto.pontoReposicao) || 5,
            observacoes: iaCommand.produto.observacoes || "Adicionado por IA"
          }
          
          await db.collection("produtos").insertOne(novoProduto)
          
          // Sucesso no banco! Substitui o JSON feio por uma mensagem bonitinha:
          responseText = `✅ Concluído! Registrei **${novoProduto.quantidadeEstoque} ${novoProduto.unidadeMedida} de ${novoProduto.nome}** no sistema.\n\nRecarregue a página para ver as alterações na tabela.`
          
        } catch (dbError) {
          console.error("Erro no MongoDB:", dbError)
          // O banco falhou! Substitui o JSON feio por uma mensagem de erro pro usuário:
          responseText = `❌ Entendi que você quer cadastrar o produto "${iaCommand.produto.nome}", mas ocorreu um erro no serviço, tente novamente mais tarde.`
        }
      } else if (iaCommand) {
        // Se a IA mandou um JSON com uma ação que não conhecemos, evitamos mostrar o JSON.
        responseText = "🤖 Processo não reconhecido. Tente pedir de outra forma."
      }

      return NextResponse.json({ response: responseText })
    }

    // ==========================================
    // LÓGICA PADRÃO (SINCRONIZAÇÃO MONGODB)
    // ==========================================
    const client = await clientPromise
    const db = client.db("tigre_acai")

    await db.collection(collection).deleteMany({})
    
    if (Array.isArray(body) && body.length > 0) {
      // Remove o _id gerado pelo Mongo para evitar conflitos na reinserção
      const dataWithoutMongoId = body.map(({ _id, ...rest }: any) => rest)
      await db.collection(collection).insertMany(dataWithoutMongoId)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (e) {
    console.error("Erro na API POST:", e)
    return NextResponse.json({ success: false, error: "Falha na requisição" }, { status: 500 })
  }
}