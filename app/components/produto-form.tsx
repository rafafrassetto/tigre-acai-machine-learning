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
import { Plus, Edit, Trash2 } from "lucide-react"
import type { Produto, Fornecedor } from "../page"

interface ProdutoFormProps {
  produtos: Produto[]
  setProdutos: (produtos: Produto[]) => void
  fornecedores: Fornecedor[]
}

export function ProdutoForm({ produtos, setProdutos, fornecedores }: ProdutoFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "sorvete" as Produto["categoria"],
    quantidadeEstoque: "",
    unidadeMedida: "",
    custoUnitario: "",
    fornecedorId: "",
    pontoReposicao: "",
    dataValidade: "",
    observacoes: "",
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "sorvete",
      quantidadeEstoque: "",
      unidadeMedida: "",
      custoUnitario: "",
      fornecedorId: "",
      pontoReposicao: "",
      dataValidade: "",
      observacoes: "",
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const produto: Produto = {
      id: editingId || Date.now().toString(),
      nome: formData.nome,
      categoria: formData.categoria,
      quantidadeEstoque: Number(formData.quantidadeEstoque),
      unidadeMedida: formData.unidadeMedida,
      custoUnitario: Number(formData.custoUnitario),
      fornecedorId: formData.fornecedorId,
      pontoReposicao: Number(formData.pontoReposicao),
      dataValidade: formData.dataValidade || undefined,
      observacoes: formData.observacoes || undefined,
    }

    if (editingId) {
      setProdutos(produtos.map((p) => (p.id === editingId ? produto : p)))
    } else {
      setProdutos([...produtos, produto])
    }

    resetForm()
  }

  const handleEdit = (produto: Produto) => {
    console.log("Editando produto:", produto);
    
    const newData = {
      nome: produto.nome || "",
      categoria: (produto.categoria || "sorvete") as Produto["categoria"],
      quantidadeEstoque: (produto.quantidadeEstoque ?? (produto as any).estoqueAtual ?? 0).toString(),
      unidadeMedida: produto.unidadeMedida || (produto as any).unidade || "",
      custoUnitario: (produto.custoUnitario ?? 0).toString(),
      fornecedorId: produto.fornecedorId || "",
      pontoReposicao: (produto.pontoReposicao ?? 0).toString(),
      dataValidade: produto.dataValidade || "",
      observacoes: produto.observacoes || "",
    };

    setFormData(newData);
    setEditingId(produto.id);
    
    // Pequeno delay para o scroll não interferir na renderização do estado
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      setProdutos(produtos.filter((p) => p.id !== id))
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels = {
      sorvete: "Sorvete",
      calda: "Calda",
      complemento: "Complemento",
      embalagem: "Embalagem",
      insumo: "Insumo",
    }
    return labels[categoria as keyof typeof labels] || categoria
  }

  const getCategoriaColor = (categoria: string) => {
    const colors = {
      sorvete: "bg-blue-100 text-blue-800",
      calda: "bg-orange-100 text-orange-800",
      complemento: "bg-green-100 text-green-800",
      embalagem: "bg-purple-100 text-purple-800",
      insumo: "bg-gray-100 text-gray-800",
    }
    return colors[categoria as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <Card key={editingId || 'new'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
          </CardTitle>
          <CardDescription>
            {editingId ? "Edite as informações do produto" : "Adicione um novo produto ao seu estoque"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Sorvete de Chocolate ao Leite"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value as Produto["categoria"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sorvete">Sorvete</SelectItem>
                    <SelectItem value="calda">Calda</SelectItem>
                    <SelectItem value="complemento">Complemento</SelectItem>
                    <SelectItem value="embalagem">Embalagem</SelectItem>
                    <SelectItem value="insumo">Insumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantidadeEstoque">Quantidade em Estoque *</Label>
                <Input
                  id="quantidadeEstoque"
                  type="number"
                  step="0.01"
                  value={formData.quantidadeEstoque}
                  onChange={(e) => setFormData({ ...formData, quantidadeEstoque: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="unidadeMedida">Unidade de Medida *</Label>
                <Input
                  id="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })}
                  placeholder="Ex: Litros, KG, Pacotes, Unidades"
                  required
                />
              </div>

              <div>
                <Label htmlFor="custoUnitario">Custo Unitário (R$) *</Label>
                <Input
                  id="custoUnitario"
                  type="number"
                  step="0.01"
                  value={formData.custoUnitario}
                  onChange={(e) => setFormData({ ...formData, custoUnitario: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="fornecedorId">Fornecedor Principal *</Label>
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

              <div>
                <Label htmlFor="pontoReposicao">Ponto de Reposição *</Label>
                <Input
                  id="pontoReposicao"
                  type="number"
                  step="0.01"
                  value={formData.pontoReposicao}
                  onChange={(e) => setFormData({ ...formData, pontoReposicao: e.target.value })}
                  placeholder="Quantidade mínima para alerta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dataValidade">Data de Validade</Label>
                <Input
                  id="dataValidade"
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o produto"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Atualizar Produto" : "Cadastrar Produto"}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>Lista de todos os produtos no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum produto cadastrado ainda</p>
          ) : (
            <div className="space-y-4">
              {produtos.map((produto) => {
                const fornecedor = fornecedores.find((f) => f.id === produto.fornecedorId)
                const estoqueStatus = produto.quantidadeEstoque <= produto.pontoReposicao ? "baixo" : "normal"

                return (
                  <div key={produto.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{produto.nome}</h3>
                          <Badge className={getCategoriaColor(produto.categoria)}>
                            {getCategoriaLabel(produto.categoria)}
                          </Badge>
                          {estoqueStatus === "baixo" && <Badge variant="destructive">Estoque Baixo</Badge>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Estoque:</span> {produto.quantidadeEstoque}{" "}
                            {produto.unidadeMedida}
                          </div>
                          <div>
                            <span className="font-medium">Custo:</span>{" "}
                            {produto.custoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                          <div>
                            <span className="font-medium">Ponto Reposição:</span> {produto.pontoReposicao}{" "}
                            {produto.unidadeMedida}
                          </div>
                          <div>
                            <span className="font-medium">Fornecedor:</span> {fornecedor?.nome || "Não definido"}
                          </div>
                        </div>

                        {produto.dataValidade && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Validade:</span>{" "}
                            {new Date(produto.dataValidade).toLocaleDateString("pt-BR")}
                          </div>
                        )}

                        {produto.observacoes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Obs:</span> {produto.observacoes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(produto)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(produto.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
