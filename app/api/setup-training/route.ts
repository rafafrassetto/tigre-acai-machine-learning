import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("tigre_acai")

    console.log("Iniciando limpeza do banco para treino...");
    
    // Limpar coleções
    await db.collection("produtos").deleteMany({})
    await db.collection("fornecedores").deleteMany({})
    await db.collection("movimentacoes").deleteMany({})
    await db.collection("memoria_ia").deleteMany({})
    await db.collection("historico_chats").deleteMany({})

    // Inserir Fornecedores
    const fornecedores = [
      { id: "f_amazon", nome: "Distribuidora Amazônia", telefone: "91 98888-0001", cnpj: "11.111.111/0001-11", condicoesPagamento: "Boleto 15 dias", observacoes: "Fornecedor de elite de açaí. Entrega apenas às segundas-feiras, 08:00." },
      { id: "f_sul", nome: "Embalagens Sul", telefone: "51 97777-0002", cnpj: "22.222.222/0001-22", condicoesPagamento: "Pix Antecipado", observacoes: "Preferimos Pix para frete grátis acima de R$ 500." },
      { id: "f_central", nome: "Laticínios Central", telefone: "11 96666-0003", cnpj: "33.333.333/0001-33", condicoesPagamento: "Faturado 7 dias", observacoes: "Leite condensado e creme de leite. Prazo de entrega: 3 dias." }
    ]
    await db.collection("fornecedores").insertMany(fornecedores)

    // Inserir Produtos
    const produtos = [
      { id: "p_acai", nome: "Polpa de Açaí 10kg", categoria: "Base", quantidadeEstoque: 25, unidadeMedida: "Balde", custoUnitario: 145.00, fornecedorId: "f_amazon", pontoReposicao: 5 },
      { id: "p_copo", nome: "Copo 400ml", categoria: "Embalagem", quantidadeEstoque: 1200, unidadeMedida: "Unidade", custoUnitario: 0.42, fornecedorId: "f_sul", pontoReposicao: 200 },
      { id: "p_leite", nome: "Leite Condensado 5kg", categoria: "Creme", quantidadeEstoque: 12, unidadeMedida: "Caixa", custoUnitario: 82.00, fornecedorId: "f_central", pontoReposicao: 5 },
      { id: "p_morango", nome: "Morango Congelado 1kg", categoria: "Fruta", quantidadeEstoque: 40, unidadeMedida: "Pacote", custoUnitario: 21.50, fornecedorId: "f_amazon", pontoReposicao: 10 }
    ]
    await db.collection("produtos").insertMany(produtos)

    // Inserir Memória de Longo Prazo (Treinamento)
    const memorias = [
      { fato: "A Distribuidora Amazônia entrega apenas às segundas-feiras, às 08:00.", data: new Date() },
      { fato: "O ponto de reposição do Leite Condensado 5kg é crítico (mínimo 5 caixas).", data: new Date() },
      { fato: "Preferimos pagar a Embalagens Sul via Pix para garantir frete grátis.", data: new Date() },
      { fato: "O Morango Congelado deve ser armazenado exclusivamente no freezer 02.", data: new Date() },
      { fato: "A Laticínios Central tem um prazo de entrega padrão de 3 dias úteis.", data: new Date() }
    ]
    await db.collection("memoria_ia").insertMany(memorias)

    // Inserir Sessão de Chat "TESTE DE ESTRESSE #1"
    const chatSession = {
      id: "teste_estresse_1",
      title: "TESTE DE ESTRESSE #1",
      updatedAt: Date.now(),
      messages: [
        { role: "assistant", content: "Olá! Sou o 🐯 Tigre IA. Sistema reiniciado e pronto para o treino intensivo." },
        { role: "user", content: "IA, aprenda as novas regras de fornecedores." },
        { role: "assistant", content: "✅ Entendido! Aprendi as regras da Distribuidora Amazônia (segundas às 08h), Embalagens Sul (Pix para frete grátis) e Laticínios Central (3 dias de prazo)." },
        { role: "user", content: "Qual a regra do Leite Condensado?" },
        { role: "assistant", content: "O Leite Condensado 5kg tem ponto de reposição crítico em 5 caixas. Devo avisar imediatamente se o estoque baixar disso." },
        { role: "user", content: "Onde guardamos o morango?" },
        { role: "assistant", content: "O Morango Congelado deve ser armazenado no freezer 02, que é o mais potente da loja." },
        { role: "assistant", content: "Estou totalmente treinada com os novos dados e regras. Como posso ajudar com o estoque hoje?" }
      ]
    }
    await db.collection("historico_chats").insertOne(chatSession)

    return NextResponse.json({
      success: true,
      message: "Banco de dados configurado, IA treinada e sessão 'TESTE DE ESTRESSE #1' criada!",
      data: {
        fornecedores: fornecedores.length,
        produtos: produtos.length,
        memorias: memorias.length,
        chatCriado: true
      }
    })

  } catch (error: any) {
    console.error("Erro no setup-training:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
