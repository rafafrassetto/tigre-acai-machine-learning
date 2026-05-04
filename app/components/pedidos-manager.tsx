"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, MessageCircle, Copy, Check } from "lucide-react"
import type { Produto, Fornecedor } from "../page"

interface PedidosManagerProps {
  produtos: Produto[]
  fornecedores: Fornecedor[]
  produtosEstoqueBaixo: Produto[]
}

interface ItemPedido {
  produtoId: string
  quantidade: number
}

export function PedidosManager({ produtos, fornecedores, produtosEstoqueBaixo }: PedidosManagerProps) {
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([])
  const [copiedFornecedor, setCopiedFornecedor] = useState<string | null>(null)

  // Adicionar produtos com estoque baixo automaticamente
  const adicionarProdutosEstoqueBaixo = () => {
    const novosItens = produtosEstoqueBaixo.map((produto) => ({
      produtoId: produto.id,
      quantidade: produto.pontoReposicao * 2,
    }))
    setItensPedido(novosItens)
  }

  const adicionarItem = (produtoId: string) => {
    if (!itensPedido.find((item) => item.produtoId === produtoId)) {
      setItensPedido([...itensPedido, { produtoId, quantidade: 1 }])
    }
  }

  const removerItem = (produtoId: string) => {
    setItensPedido(itensPedido.filter((item) => item.produtoId !== produtoId))
  }

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    setItensPedido(itensPedido.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item)))
  }

  // Agrupar itens por fornecedor
  const pedidosPorFornecedor = () => {
    const grupos: { [fornecedorId: string]: ItemPedido[] } = {}

    itensPedido.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)
      if (produto) {
        if (!grupos[produto.fornecedorId]) {
          grupos[produto.fornecedorId] = []
        }
        grupos[produto.fornecedorId].push(item)
      }
    })

    return grupos
  }

  const gerarMensagemWhatsApp = (fornecedorId: string, itens: ItemPedido[]) => {
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
    if (!fornecedor) return ""

    let mensagem = `Olá ${fornecedor.nome}!\n\n`
    mensagem += `Preciso dos seguintes itens:\n\n`

    itens.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)
      if (produto) {
        mensagem += `• ${item.quantidade} ${produto.unidadeMedida} de ${produto.nome}\n`
      }
    })

    mensagem += `\nPor favor, confirme a disponibilidade e o valor total.\n\n`
    mensagem += `Obrigado!`

    return mensagem
  }

  const copiarMensagem = async (fornecedorId: string, itens: ItemPedido[]) => {
    const mensagem = gerarMensagemWhatsApp(fornecedorId, itens)
    try {
      await navigator.clipboard.writeText(mensagem)
      setCopiedFornecedor(fornecedorId)
      setTimeout(() => setCopiedFornecedor(null), 2000)
    } catch (err) {
      console.error("Erro ao copiar mensagem:", err)
    }
  }

  const abrirWhatsApp = (fornecedorId: string, itens: ItemPedido[]) => {
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
    if (!fornecedor) return

    const mensagem = gerarMensagemWhatsApp(fornecedorId, itens)
    const telefone = fornecedor.telefone.replace(/\D/g, "")
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")
  }

  const grupos = pedidosPorFornecedor()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sistema de Pedidos Automatizados
          </CardTitle>
          <CardDescription>
            Selecione os produtos que precisa pedir e gere mensagens automáticas para WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {produtosEstoqueBaixo.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Produtos com Estoque Baixo</h4>
              <p className="text-sm text-red-600 mb-3">
                {produtosEstoqueBaixo.length} produto(s) precisam ser repostos
              </p>
              <Button onClick={adicionarProdutosEstoqueBaixo} variant="outline" className="bg-white">
                Adicionar Todos ao Pedido
              </Button>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">Selecionar Produtos para Pedido</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {produtos.map((produto) => {
                const itemExistente = itensPedido.find((item) => item.produtoId === produto.id)
                const fornecedor = fornecedores.find((f) => f.id === produto.fornecedorId)

                return (
                  <div key={produto.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={!!itemExistente}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            adicionarItem(produto.id)
                          } else {
                            removerItem(produto.id)
                          }
                        }}
                      />
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-gray-600">
                          Estoque: {produto.quantidadeEstoque} {produto.unidadeMedida} | Fornecedor:{" "}
                          {fornecedor?.nome || "Não definido"}
                        </p>
                      </div>
                    </div>

                    {itemExistente && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`quantidade-${produto.id}`} className="text-sm">
                          Qtd:
                        </Label>
                        <Input
                          id={`quantidade-${produto.id}`}
                          type="number"
                          min="1"
                          step="0.01"
                          value={itemExistente.quantidade}
                          onChange={(e) => atualizarQuantidade(produto.id, Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">{produto.unidadeMedida}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(grupos).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Fornecedor</CardTitle>
            <CardDescription>Mensagens organizadas por fornecedor para envio via WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(grupos).map(([fornecedorId, itens]) => {
              const fornecedor = fornecedores.find((f) => f.id === fornecedorId)
              if (!fornecedor) return null

              const valorTotal = itens.reduce((total, item) => {
                const produto = produtos.find((p) => p.id === item.produtoId)
                return total + (produto ? produto.custoUnitario * item.quantidade : 0)
              }, 0)

              return (
                <div key={fornecedorId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{fornecedor.nome}</h4>
                      <p className="text-sm text-gray-600">{fornecedor.telefone}</p>
                    </div>
                    <Badge variant="outline">{itens.length} item(s)</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {itens.map((item) => {
                      const produto = produtos.find((p) => p.id === item.produtoId)
                      if (!produto) return null

                      return (
                        <div key={item.produtoId} className="flex justify-between items-center py-2">
                          <span>{produto.nome}</span>
                          <span className="font-medium">
                            {item.quantidade} {produto.unidadeMedida}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Valor Estimado:</span>
                    <span className="font-semibold text-lg">
                      {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h5 className="font-medium mb-2">Prévia da Mensagem:</h5>
                    <pre className="text-sm whitespace-pre-wrap text-gray-700">
                      {gerarMensagemWhatsApp(fornecedorId, itens)}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => abrirWhatsApp(fornecedorId, itens)} className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar via WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => copiarMensagem(fornecedorId, itens)}>
                      {copiedFornecedor === fornecedorId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {itensPedido.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum item selecionado para pedido</p>
            <p className="text-sm text-gray-400 mt-2">Selecione produtos acima para gerar pedidos automáticos</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
