"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Package, Users, Calendar, Download } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Produto, Fornecedor, Movimentacao } from "../page"

interface RelatoriosManagerProps {
  produtos: Produto[]
  fornecedores: Fornecedor[]
  movimentacoes: Movimentacao[]
}

export function RelatoriosManager({ produtos, fornecedores, movimentacoes }: RelatoriosManagerProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("30") // dias
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("todos")

  const getMovimentacoesPorPeriodo = (dias: number) => {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - dias)

    return movimentacoes.filter((mov) => new Date(mov.data) >= dataLimite)
  }

  const getProdutosEstoqueBaixo = () => {
    return produtos.filter((p) => p.quantidadeEstoque <= p.pontoReposicao)
  }

  const getComprasPorFornecedor = () => {
    const compras: { [fornecedorId: string]: { quantidade: number; valor: number; itens: number } } = {}

    const movimentacoesPeriodo = getMovimentacoesPorPeriodo(Number(periodoSelecionado))

    movimentacoesPeriodo
      .filter((mov) => mov.tipo === "entrada" && mov.fornecedorId)
      .forEach((mov) => {
        const fornecedorId = mov.fornecedorId!
        if (!compras[fornecedorId]) {
          compras[fornecedorId] = { quantidade: 0, valor: 0, itens: 0 }
        }

        compras[fornecedorId].quantidade += mov.quantidade
        compras[fornecedorId].valor += (mov.custoUnitario || 0) * mov.quantidade
        compras[fornecedorId].itens += 1
      })

    return compras
  }

  const getVariacaoPrecos = () => {
    const variacoes: { [produtoId: string]: { atual: number; anterior: number; variacao: number } } = {}

    produtos.forEach((produto) => {
      const movimentacoesEntrada = movimentacoes
        .filter((mov) => mov.produtoId === produto.id && mov.tipo === "entrada" && mov.custoUnitario)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      if (movimentacoesEntrada.length >= 2) {
        const atual = movimentacoesEntrada[0].custoUnitario!
        const anterior = movimentacoesEntrada[1].custoUnitario!
        const variacao = ((atual - anterior) / anterior) * 100

        variacoes[produto.id] = { atual, anterior, variacao }
      }
    })

    return variacoes
  }

  const getConsumoMedio = () => {
    const consumo: { [produtoId: string]: { totalSaidas: number; diasComMovimento: number; mediaDiaria: number } } = {}

    const movimentacoesPeriodo = getMovimentacoesPorPeriodo(Number(periodoSelecionado))

    produtos.forEach((produto) => {
      const saidas = movimentacoesPeriodo.filter((mov) => mov.produtoId === produto.id && mov.tipo === "saida")
      const totalSaidas = saidas.reduce((total, mov) => total + mov.quantidade, 0)

      const diasUnicos = new Set(saidas.map((mov) => new Date(mov.data).toDateString())).size

      consumo[produto.id] = {
        totalSaidas,
        diasComMovimento: diasUnicos,
        mediaDiaria: diasUnicos > 0 ? totalSaidas / diasUnicos : 0,
      }
    })

    return consumo
  }

  const exportarRelatorio = (tipo: string) => {
    const doc = new jsPDF()
    const dataAtual = new Date().toLocaleDateString("pt-BR")

    // Cabeçalho do PDF
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("Tigre Açaí", 14, 22)
    
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    
    let titulo = ""
    let head = [[]] as string[][]
    let body = [] as (string | number)[][]

    switch (tipo) {
      case "estoque-baixo":
        titulo = "Relatório de Estoque Baixo"
        head = [["Produto", "Categoria", "Estoque Atual", "Ponto Mínimo", "Sugestão de Pedido"]]
        body = getProdutosEstoqueBaixo().map(produto => [
          produto.nome,
          produto.categoria,
          `${produto.quantidadeEstoque} ${produto.unidadeMedida}`,
          `${produto.pontoReposicao} ${produto.unidadeMedida}`,
          `${produto.pontoReposicao * 2} ${produto.unidadeMedida}`
        ])
        break

      case "compras-fornecedor":
        titulo = "Relatório de Compras por Fornecedor"
        head = [["Fornecedor", "Qtd Compras", "Itens Comprados", "Valor Total (R$)"]]
        body = Object.entries(getComprasPorFornecedor()).map(([fornecedorId, dados]) => {
          const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
          return [
            fornecedor?.nome || "Desconhecido",
            dados.itens,
            dados.quantidade.toFixed(2),
            `R$ ${dados.valor.toFixed(2)}`
          ]
        })
        break
    }

    doc.text(`${titulo} - ${dataAtual}`, 14, 32)

    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    doc.save(`relatorio-${tipo}-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const produtosEstoqueBaixo = getProdutosEstoqueBaixo()
  const comprasPorFornecedor = getComprasPorFornecedor()
  const variacaoPrecos = getVariacaoPrecos()
  const consumoMedio = getConsumoMedio()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios e Análises
          </CardTitle>
          <CardDescription>Análise detalhada do seu estoque e movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Período de Análise:</label>
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="estoque-baixo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="estoque-baixo">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="compras-fornecedor">Compras</TabsTrigger>
          <TabsTrigger value="variacao-precos">Preços</TabsTrigger>
          <TabsTrigger value="consumo">Consumo</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque-baixo">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos em Estoque Baixo
                </CardTitle>
                <CardDescription>Produtos que atingiram o ponto de reposição</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportarRelatorio("estoque-baixo")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {produtosEstoqueBaixo.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Todos os produtos estão com estoque adequado!</p>
              ) : (
                <div className="space-y-4">
                  {produtosEstoqueBaixo.map((produto) => {
                    const fornecedor = fornecedores.find((f) => f.id === produto.fornecedorId)
                    const percentualEstoque = (produto.quantidadeEstoque / produto.pontoReposicao) * 100

                    return (
                      <div key={produto.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                          <h4 className="font-medium">{produto.nome}</h4>
                          <Badge variant="destructive">{percentualEstoque.toFixed(0)}% do mínimo</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Estoque Atual:</span>
                            <p className="text-lg font-semibold text-red-600">
                              {produto.quantidadeEstoque} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Ponto Mínimo:</span>
                            <p className="text-lg font-semibold">
                              {produto.pontoReposicao} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Sugestão Pedido:</span>
                            <p className="text-lg font-semibold text-green-600">
                              {produto.pontoReposicao * 2} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Fornecedor:</span>
                            <p className="font-semibold">{fornecedor?.nome || "Não definido"}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compras-fornecedor">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Compras por Fornecedor
                </CardTitle>
                <CardDescription>Análise de gastos nos últimos {periodoSelecionado} dias</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportarRelatorio("compras-fornecedor")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(comprasPorFornecedor).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma compra registrada no período selecionado</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(comprasPorFornecedor)
                    .sort(([, a], [, b]) => b.valor - a.valor)
                    .map(([fornecedorId, dados]) => {
                      const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
                      if (!fornecedor) return null

                      return (
                        <div key={fornecedorId} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                            <h4 className="font-medium text-lg">{fornecedor.nome}</h4>
                            <Badge variant="outline">{dados.itens} compra(s)</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Valor Total:</span>
                              <p className="text-xl font-bold text-green-600">
                                {dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Quantidade Total:</span>
                              <p className="text-xl font-bold">{dados.quantidade.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Valor Médio/Compra:</span>
                              <p className="text-xl font-bold">
                                {(dados.valor / dados.itens).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Contato:</span> {fornecedor.telefone}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variacao-precos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Variação de Preços
              </CardTitle>
              <CardDescription>Comparação entre os últimos preços de compra</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(variacaoPrecos).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Dados insuficientes para análise de variação de preços</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(variacaoPrecos)
                    .sort(([, a], [, b]) => Math.abs(b.variacao) - Math.abs(a.variacao))
                    .map(([produtoId, dados]) => {
                      const produto = produtos.find((p) => p.id === produtoId)
                      if (!produto) return null

                      const isAumento = dados.variacao > 0
                      const corVariacao = isAumento ? "text-red-600" : "text-green-600"
                      const iconeVariacao = isAumento ? "↗" : "↘"

                      return (
                        <div key={produtoId} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                            <h4 className="font-medium">{produto.nome}</h4>
                            <Badge variant={isAumento ? "destructive" : "default"}>
                              {iconeVariacao} {Math.abs(dados.variacao).toFixed(1)}%
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Preço Anterior:</span>
                              <p className="text-lg font-semibold">
                                {dados.anterior.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Preço Atual:</span>
                              <p className="text-lg font-semibold">
                                {dados.atual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Diferença:</span>
                              <p className={`text-lg font-semibold ${corVariacao}`}>
                                {(dados.atual - dados.anterior).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Análise de Consumo
              </CardTitle>
              <CardDescription>Consumo médio por produto nos últimos {periodoSelecionado} dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {produtos
                  .filter((produto) => consumoMedio[produto.id]?.totalSaidas > 0)
                  .sort((a, b) => consumoMedio[b.id].mediaDiaria - consumoMedio[a.id].mediaDiaria)
                  .map((produto) => {
                    const dados = consumoMedio[produto.id]
                    const diasParaEsgotar =
                      dados.mediaDiaria > 0 ? produto.quantidadeEstoque / dados.mediaDiaria : Number.POSITIVE_INFINITY

                    return (
                      <div key={produto.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                          <h4 className="font-medium">{produto.nome}</h4>
                          <Badge
                            variant={
                              diasParaEsgotar < 7 ? "destructive" : diasParaEsgotar < 14 ? "secondary" : "default"
                            }
                          >
                            {diasParaEsgotar === Number.POSITIVE_INFINITY
                              ? "Sem consumo"
                              : `${Math.ceil(diasParaEsgotar)} dias restantes`}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Consumo Total:</span>
                            <p className="text-lg font-semibold">
                              {dados.totalSaidas} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Média Diária:</span>
                            <p className="text-lg font-semibold">
                              {dados.mediaDiaria.toFixed(2)} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Estoque Atual:</span>
                            <p className="text-lg font-semibold">
                              {produto.quantidadeEstoque} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Sugestão Pedido:</span>
                            <p className="text-lg font-semibold text-blue-600">
                              {Math.ceil(dados.mediaDiaria * 30)} {produto.unidadeMedida}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {produtos.filter((produto) => consumoMedio[produto.id]?.totalSaidas > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nenhuma movimentação de saída registrada no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
