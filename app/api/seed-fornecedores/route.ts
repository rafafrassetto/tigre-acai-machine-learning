import { NextResponse } from "next/server"
import clientPromise from "@/app/lib/mongodb"

export const dynamic = "force-dynamic"

/**
 * SCRIPT DE SEED — Rota temporária para corrigir a coleção de fornecedores.
 * 
 * Acesse GET /api/seed-fornecedores no navegador para executar.
 * Depois de executar, pode deletar este arquivo.
 * 
 * O que faz:
 * 1. Limpa a coleção fornecedores (que contém dados errados de produtos)
 * 2. Insere fornecedores fictícios realistas para uma açaiteria pequena
 * 3. Atualiza os produtos para vincular aos fornecedores corretos
 * 4. Remove o produto lixo "dfgfdgfdg"
 */
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("tigre_acai")

    // ==========================================
    // 1. LIMPAR coleção de fornecedores (dados errados)
    // ==========================================
    const deleteResult = await db.collection("fornecedores").deleteMany({})
    
    // ==========================================
    // 2. INSERIR fornecedores corretos
    // ==========================================
    // IDs escolhidos para bater com os fornecedorId já existentes nos produtos
    const fornecedores = [
      {
        id: "zezinho",
        nome: "Zezinho Polpas",
        telefone: "48991234567",
        cnpj: "12.345.678/0001-01",
        endereco: "Rua das Palmeiras, 120 - Florianópolis/SC",
        condicoesPagamento: "30 dias",
        observacoes: "Fornecedor principal de açaí e polpas. Entrega toda segunda-feira."
      },
      {
        id: "amazonia_polpas",
        nome: "Amazônia Polpas LTDA",
        telefone: "91988765432",
        cnpj: "23.456.789/0001-02",
        endereco: "Av. Augusto Montenegro, 2500 - Belém/PA",
        condicoesPagamento: "15/30 dias",
        observacoes: "Açaí premium direto do Pará. Frete incluso acima de 50 baldes."
      },
      {
        id: "Kibon",
        nome: "Kibon / Unilever",
        telefone: "08007011155",
        cnpj: "01.615.814/0001-35",
        endereco: "Distribuição regional SC",
        condicoesPagamento: "À vista ou 7 dias",
        observacoes: "Sorvetes industriais. Pedido mínimo de 100 litros."
      },
      {
        id: "123",
        nome: "Grãos & Cereais Distribuidora",
        telefone: "48998887766",
        cnpj: "34.567.890/0001-03",
        endereco: "Rua Vidal Ramos, 55 - São José/SC",
        condicoesPagamento: "À vista",
        observacoes: "Granola, aveia, castanhas e cereais em geral. Melhor preço da região."
      },
      {
        id: "456",
        nome: "Laticínios Vale Verde",
        telefone: "48997776655",
        cnpj: "45.678.901/0001-04",
        endereco: "Estrada Geral, km 12 - Águas Mornas/SC",
        condicoesPagamento: "15 dias",
        observacoes: "Leite em pó, leite condensado e creme de leite. Entrega às quartas."
      },
      {
        id: "789",
        nome: "EmbalaFácil Descartáveis",
        telefone: "48996665544",
        cnpj: "56.789.012/0001-05",
        endereco: "Rua Industrial, 300 - Palhoça/SC",
        condicoesPagamento: "30/60 dias",
        observacoes: "Copos, colheres, tampas e embalagens. Desconto acima de 5000 unidades."
      },
      {
        id: "frutas_joca",
        nome: "Joca Frutas Selecionadas",
        telefone: "48995554433",
        cnpj: "",
        endereco: "CEASA - Box 47 - São José/SC",
        condicoesPagamento: "À vista",
        observacoes: "Morango, banana, manga e frutas frescas. Compra direta no CEASA."
      },
      {
        id: "doces_maria",
        nome: "Maria Doces Artesanais",
        telefone: "48994443322",
        cnpj: "67.890.123/0001-06",
        endereco: "Rua Conselheiro Mafra, 80 - Florianópolis/SC",
        condicoesPagamento: "À vista",
        observacoes: "Caldas artesanais de chocolate, morango e caramelo. Entrega sob encomenda."
      }
    ]

    await db.collection("fornecedores").insertMany(fornecedores)

    // ==========================================
    // 3. REMOVER produto lixo "dfgfdgfdg"
    // ==========================================
    const removeLixo = await db.collection("produtos").deleteMany({ nome: "dfgfdgfdg" })

    // ==========================================
    // 4. ATUALIZAR produtos com fornecedorId inválido
    // ==========================================
    // O produto com fornecedorId "1775863970650" (que era do dfgfdgfdg) já foi deletado acima
    // Vamos verificar se algum produto tem fornecedorId que não existe nos novos fornecedores
    const fornecedorIds = fornecedores.map(f => f.id)
    const produtosOrfaos = await db.collection("produtos").find({
      fornecedorId: { $nin: [...fornecedorIds, ""] }
    }).toArray()

    const orphanInfo = produtosOrfaos.map(p => `${p.nome} (fornecedorId: ${p.fornecedorId})`)

    return NextResponse.json({
      sucesso: true,
      mensagem: "Seed executado com sucesso!",
      detalhes: {
        fornecedoresRemovidos: deleteResult.deletedCount,
        fornecedoresInseridos: fornecedores.length,
        produtoLixoRemovido: removeLixo.deletedCount,
        produtosOrfaos: orphanInfo.length > 0 ? orphanInfo : "Nenhum - todos os produtos têm fornecedor válido"
      }
    })

  } catch (error: any) {
    console.error("Erro no seed:", error)
    return NextResponse.json({ 
      sucesso: false, 
      erro: error?.message || "Erro desconhecido" 
    }, { status: 500 })
  }
}
