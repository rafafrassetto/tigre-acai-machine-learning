"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Phone } from "lucide-react"
import type { Fornecedor } from "../page"

interface FornecedorFormProps {
  fornecedores: Fornecedor[]
  setFornecedores: (fornecedores: Fornecedor[]) => void
}

export function FornecedorForm({ fornecedores, setFornecedores }: FornecedorFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cnpj: "",
    endereco: "",
    condicoesPagamento: "",
    observacoes: "",
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      telefone: "",
      cnpj: "",
      endereco: "",
      condicoesPagamento: "",
      observacoes: "",
    })
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const fornecedor: Fornecedor = {
      id: editingId || Date.now().toString(),
      nome: formData.nome,
      telefone: formData.telefone,
      cnpj: formData.cnpj || undefined,
      endereco: formData.endereco || undefined,
      condicoesPagamento: formData.condicoesPagamento || undefined,
      observacoes: formData.observacoes || undefined,
    }

    if (editingId) {
      setFornecedores(fornecedores.map((f) => (f.id === editingId ? fornecedor : f)))
    } else {
      setFornecedores([...fornecedores, fornecedor])
    }

    resetForm()
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setFormData({
      nome: fornecedor.nome,
      telefone: fornecedor.telefone,
      cnpj: fornecedor.cnpj || "",
      endereco: fornecedor.endereco || "",
      condicoesPagamento: fornecedor.condicoesPagamento || "",
      observacoes: fornecedor.observacoes || "",
    })
    setEditingId(fornecedor.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      setFornecedores(fornecedores.filter((f) => f.id !== id))
    }
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return "N/A"
    const phoneString = String(phone)
    const numbers = phoneString.replace(/\D/g, "")
    if (numbers.length >= 10 && numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
    }
    return phoneString
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
          </CardTitle>
          <CardDescription>
            {editingId ? "Edite as informações do fornecedor" : "Adicione um novo fornecedor ao sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Fornecedor *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Distribuidora de Sorvetes ABC"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <Label htmlFor="condicoesPagamento">Condições de Pagamento</Label>
                <Input
                  id="condicoesPagamento"
                  value={formData.condicoesPagamento}
                  onChange={(e) => setFormData({ ...formData, condicoesPagamento: e.target.value })}
                  placeholder="Ex: 30 dias, À vista, 15/30 dias"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo do fornecedor"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observacoes</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Ex: Entregas às terças e quintas"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Atualizar Fornecedor" : "Cadastrar Fornecedor"}</Button>
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
          <CardTitle>Fornecedores Cadastrados</CardTitle>
          <CardDescription>Lista de todos os fornecedores no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {fornecedores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum fornecedor cadastrado ainda</p>
          ) : (
            <div className="space-y-4">
              {fornecedores.map((fornecedor) => (
                <div key={fornecedor.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{fornecedor.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{formatPhone(fornecedor.telefone)}</span>
                        </div>
                        {fornecedor.cnpj && (
                          <div>
                            <span className="font-medium">CNPJ:</span> {fornecedor.cnpj}
                          </div>
                        )}
                        {fornecedor.condicoesPagamento && (
                          <div>
                            <span className="font-medium">Pagamento:</span> {fornecedor.condicoesPagamento}
                          </div>
                        )}
                      </div>
                      {fornecedor.endereco && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Endereço:</span> {fornecedor.endereco}
                        </div>
                      )}
                      {fornecedor.observacoes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Obs:</span> {fornecedor.observacoes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(fornecedor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(fornecedor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}