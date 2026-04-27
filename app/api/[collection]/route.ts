import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"

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

    if (collection === "chat") {
      const { message, history, estoqueContext } = body

      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Chave de API não configurada." }, { status: 500 })
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `Você é um assistente virtual especialista em um sistema de gerenciamento de estoque de uma açaiteria/sorveteria. 
        Você recebe um objeto JSON contendo três listas: 'produtos', 'fornecedores' e 'ultimasMovimentacoes'. NUNCA confunda produtos com fornecedores. Fornecedores são as empresas/pessoas. Produtos são os itens de estoque.
        
        Você tem TRÊS modos de agir. O seu comportamento depende ESTRITAMENTE da intenção do usuário:
        
        MODO 1 - CONVERSA (Leitura e Dúvidas):
        Se o usuário fizer perguntas, consultar quantidades, quiser saber sobre saídas de estoque ou informações de fornecedores, responda de forma clara, amigável e direta usando os dados abaixo:
        DADOS: ${JSON.stringify(estoqueContext)}
        
        MODO 2 - INSERÇÃO DE PRODUTO: 
        Se o usuário pedir para CADASTRAR, REGISTRAR, ADICIONAR ou INSERIR um novo produto ou quantidade de estoque (Ex: "Registrar sorvete de morango 15 litros"). 
        Você DEVE responder EXATAMENTE e APENAS com um objeto JSON válido, sem NENHUM texto antes ou depois. NUNCA use aspas triplas de código (\`\`\`).
        Formato obrigatório:
        {
          "acao": "INSERIR_PRODUTO",
          "produto": {
            "nome": "Nome do produto",
            "categoria": "sorvete",
            "quantidadeEstoque": 15,
            "unidadeMedida": "Litros",
            "custoUnitario": 0,
            "fornecedorId": "",
            "pontoReposicao": 5,
            "observacoes": "Cadastrado via IA"
          }
        }
        
        MODO 3 - REMOÇÃO DE PRODUTO:
        Se o usuário pedir EXPLICITAMENTE para DELETAR, REMOVER, EXCLUIR ou APAGAR um produto do estoque (Ex: "Remova o copo de 500ml do estoque").
        Você DEVE responder EXATAMENTE e APENAS com um objeto JSON válido, sem texto. NUNCA use aspas triplas de código (\`\`\`).
        Formato obrigatório:
        {
          "acao": "REMOVER_PRODUTO",
          "nomeProduto": "nome exato ou parte do nome do produto a ser removido"
        }`
      })

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }))

      const chat = model.startChat({ history: formattedHistory })
      const result = await chat.sendMessage(message)
      let responseText = result.response.text()

      let iaCommand = null;
      try {
        const cleanJsonString = responseText.replace(/```json\n?|\n?```/g, '').trim()
        if (cleanJsonString.startsWith('{') && cleanJsonString.includes('"acao"')) {
          iaCommand = JSON.parse(cleanJsonString)
        }
      } catch (parseError) {
      }

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
            observacoes: iaCommand.produto.observacoes || "Adicionado via IA"
          }
          
          await db.collection("produtos").insertOne(novoProduto)
          
          responseText = `✅ Concluído! Registrei **${novoProduto.quantidadeEstoque} ${novoProduto.unidadeMedida} de ${novoProduto.nome}** no sistema.\n\nRecarregue a página para atualizar as tabelas.`
          
        } catch (dbError) {
          console.error("Erro no MongoDB:", dbError)
          responseText = `❌ Ocorreu um erro no banco de dados ao tentar cadastrar "${iaCommand.produto.nome}". Tente novamente.`
        }
      } else if (iaCommand && iaCommand.acao === "REMOVER_PRODUTO" && iaCommand.nomeProduto) {
        try {
          const client = await clientPromise
          const db = client.db("tigre_acai")
          
          const regex = new RegExp(iaCommand.nomeProduto, "i")
          const deleteResult = await db.collection("produtos").deleteMany({ nome: regex })
          
          if (deleteResult.deletedCount > 0) {
            responseText = `🗑️ Concluído! Removi **${deleteResult.deletedCount} produto(s)** correspondente(s) a "${iaCommand.nomeProduto}" do seu estoque.\n\nRecarregue a página para atualizar as tabelas.`
          } else {
            responseText = `⚠️ Não encontrei nenhum produto com o nome parecido com "${iaCommand.nomeProduto}" para remover. Verifique o nome e tente novamente.`
          }
        } catch (dbError) {
          console.error("Erro no MongoDB:", dbError)
          responseText = `❌ Ocorreu um erro no banco de dados ao tentar remover o produto. Tente novamente.`
        }
      } else if (iaCommand) {
        responseText = "🤖 Processo JSON não reconhecido pela minha lógica. Tente pedir de forma mais clara."
      }

      return NextResponse.json({ response: responseText })
    }

    const client = await clientPromise
    const db = client.db("tigre_acai")

    await db.collection(collection).deleteMany({})
    
    if (Array.isArray(body) && body.length > 0) {
      const dataWithoutMongoId = body.map(({ _id, ...rest }: any) => rest)
      await db.collection(collection).insertMany(dataWithoutMongoId)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (e) {
    console.error("Erro na API POST:", e)
    return NextResponse.json({ success: false, error: "Falha na requisição" }, { status: 500 })
  }
}