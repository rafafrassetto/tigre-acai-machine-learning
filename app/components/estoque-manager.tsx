"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Package, History } from "lucide-react"
import type { Produto, Fornecedor, Movimentacao } from "../page"

interface EstoqueManagerProps {
  produtos: Produto[]
  setProdutos: (produtos: Produto[]) => void
  fornecedores: Fornecedor[]
  movimentacoes: Movimentacao[]
  setMovimentacoes: (movimentacoes: Movimentacao[]) => void
}

export function EstoqueManager({
  produtos,
  setProdutos,
  fornecedores,
  movimentacoes,
  setMovimentacoes,
}: EstoqueManagerProps) {
  const [formData, setFormData] = useState({
    produtoId: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    custoUnitario: "",
    fornecedorId: "",
    numeroPedido: "",
    observacoes: "",
  })

  const resetForm = () => {
    setFormData({
      produtoId: "",
      tipo: "entrada",
      quantidade: "",
      custoUnitario: "",
      fornecedorId: "",
      numeroPedido: "",
      observacoes: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const produto = produtos.find((p) => p.id === formData.produtoId)
    if (!produto) return

    const quantidade = Number(formData.quantidade)
    const custoUnitario = formData.custoUnitario ? Number(formData.custoUnitario) : undefined

    // Criar movimentação
    const movimentacao: Movimentacao = {
      id: Date.now().toString(),
      produtoId: formData.produtoId,
      tipo: formData.tipo,
      quantidade,
      custoUnitario,
      fornecedorId: formData.fornecedorId || undefined,
      data: new Date().toISOString(),
      numeroPedido: formData.numeroPedido || undefined,
      observacoes: formData.observacoes || undefined,
    }

    setMovimentacoes([...movimentacoes, movimentacao])

    // Atualizar estoque do produto
    const novaQuantidade =
      formData.tipo === "entrada" ? produto.quantidadeEstoque + quantidade : produto.quantidadeEstoque - quantidade

    // Atualizar custo unitário se fornecido (apenas para entradas)
    const novoCusto = formData.tipo === "entrada" && custoUnitario ? custoUnitario : produto.custoUnitario

    const produtoAtualizado = {
      ...produto,
      quantidadeEstoque: Math.max(0, novaQuantidade),
      custoUnitario: novoCusto,
    }

    setProdutos(produtos.map((p) => (p.id === formData.produtoId ? produtoAtualizado : p)))
    resetForm()
  }

  const produtoSelecionado = produtos.find((p) => p.id === formData.produtoId)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="movimentacao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="movimentacao">Nova Movimentação</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="estoque-atual">Estoque Atual</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Registrar Movimentação de Estoque
              </CardTitle>
              <CardDescription>Registre entradas (compras) e saídas (vendas/uso) de produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="produtoId">Produto *</Label>
                    <Select
                      value={formData.produtoId}
                      onValueChange={(value) => setFormData({ ...formData, produtoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - {produto.quantidadeEstoque} {produto.unidadeMedida}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Movimentação *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value as "entrada" | "saida" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Compra/Recebimento)</SelectItem>
                        <SelectItem value="saida">Saída (Venda/Uso)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      step="0.01"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                      placeholder="0"
                      required
                    />
                    {produtoSelecionado && (
                      <p className="text-sm text-gray-500 mt-1">Unidade: {produtoSelecionado.unidadeMedida}</p>
                    )}
                  </div>

                  {formData.tipo === "entrada" && (
                    <div>
                      <Label htmlFor="custoUnitario">Custo Unitário (R$)</Label>
                      <Input
                        id="custoUnitario"
                        type="number"
                        step="0.01"
                        value={formData.custoUnitario}
                        onChange={(e) => setFormData({ ...formData, custoUnitario: e.target.value })}
                        placeholder="Deixe vazio para manter o atual"
                      />
                      {produtoSelecionado && (
                        <p className="text-sm text-gray-500 mt-1">
                          Custo atual:{" "}
                          {produtoSelecionado.custoUnitario.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.tipo === "entrada" && (
                    <div>
                      <Label htmlFor="fornecedorId">Fornecedor</Label>
                      <Select
                        value={formData.fornecedorId}
                        onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="numeroPedido">Número do Pedido</Label>
                    <Input
                      id="numeroPedido"
                      value={formData.numeroPedido}
                      onChange={(e) => setFormData({ ...formData, numeroPedido: e.target.value })}
                      placeholder="Ex: PED-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais sobre a movimentação"
                    rows={3}
                  />
                </div>

                {produtoSelecionado && formData.quantidade && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Resumo da Movimentação</h4>
                    <div className="text-sm text-blue-800">
                      <p>Produto: {produtoSelecionado.nome}</p>
                      <p>
                        Estoque atual: {produtoSelecionado.quantidadeEstoque} {produtoSelecionado.unidadeMedida}
                      </p>
                      <p>
                        Estoque após movimentação:{" "}
                        {formData.tipo === "entrada"
                          ? produtoSelecionado.quantidadeEstoque + Number(formData.quantidade)
                          : Math.max(0, produtoSelecionado.quantidadeEstoque - Number(formData.quantidade))}{" "}
                        {produtoSelecionado.unidadeMedida}
                      </p>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={!formData.produtoId || !formData.quantidade}>
                  {formData.tipo === "entrada" ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Entrada
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4 mr-2" />
                      Registrar Saída
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
              <CardDescription>Todas as movimentações de estoque registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma movimentação registrada ainda</p>
              ) : (
                <div className="space-y-4">
                  {movimentacoes
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((mov) => {
                      const produto = produtos.find((p) => p.id === mov.produtoId)
                      const fornecedor = fornecedores.find((f) => f.id === mov.fornecedorId)

                      return (
                        <div key={mov.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-2">
                            <div>
                              <h4 className="font-medium">{produto?.nome || "Produto não encontrado"}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(mov.data).toLocaleDateString("pt-BR")} às{" "}
                                {new Date(mov.data).toLocaleTimeString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant={mov.tipo === "entrada" ? "default" : "secondary"}>
                              {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Quantidade:</span> {mov.quantidade} {produto?.unidadeMedida}
                            </div>
                            {mov.custoUnitario && (
                              <div>
                                <span className="font-medium">Custo Unit.:</span>{" "}
                                {mov.custoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </div>
                            )}
                            {mov.fornecedorId && (
                              <div>
                                <span className="font-medium">Fornecedor:</span> {fornecedor?.nome}
                              </div>
                            )}
                            {mov.numeroPedido && (
                              <div>
                                <span className="font-medium">Pedido:</span> {mov.numeroPedido}
                              </div>
                            )}
                          </div>

                          {mov.observacoes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Obs:</span> {mov.observacoes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque-atual">
          <Card>
            <CardHeader>
              <CardTitle>Estoque Atual</CardTitle>
              <CardDescription>Situação atual de todos os produtos</CardDescription>
            </CardHeader>
            <CardContent>
              {produtos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum produto cadastrado ainda</p>
              ) : (
                <div className="space-y-4">
                  {produtos.map((produto) => {
                    const fornecedor = fornecedores.find((f) => f.id === produto.fornecedorId)
                    const estoqueStatus = produto.quantidadeEstoque <= produto.pontoReposicao ? "baixo" : "normal"
                    const valorTotalProduto = produto.quantidadeEstoque * produto.custoUnitario

                    return (
                      <div key={produto.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row items-start justify-between mb-2 gap-2">
                          <div>
                            <h4 className="font-medium">{produto.nome}</h4>
                            <p className="text-sm text-gray-600">Fornecedor: {fornecedor?.nome || "Não definido"}</p>
                          </div>
                          {estoqueStatus === "baixo" && <Badge variant="destructive">Estoque Baixo</Badge>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Estoque:</span>
                            <p className="text-lg font-semibold">
                              {produto.quantidadeEstoque} {produto.unidadeMedida}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Custo Unitário:</span>
                            <p className="text-lg font-semibold">
                              {produto.custoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Valor Total:</span>
                            <p className="text-lg font-semibold">
                              {valorTotalProduto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Ponto Reposição:</span>
                            <p className="text-lg font-semibold">
                              {produto.pontoReposicao} {produto.unidadeMedida}
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
      </Tabs>
    </div>
  )
}
