"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users, LogOut, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ProdutoForm } from "./components/produto-form"
import { FornecedorForm } from "./components/fornecedor-form"
import { EstoqueManager } from "./components/estoque-manager"
import { PedidosManager } from "./components/pedidos-manager"
import { RelatoriosManager } from "./components/relatorios-manager"
import { Login } from "./components/login"
import { useLocalStorage } from "./hooks/use-local-storage"
import { useMongoSync } from "./hooks/use-mongo-sync"
import { ChatWidget } from "./components/chat-widget"

export interface Produto {
  id: string
  nome: string
  categoria: "sorvete" | "calda" | "complemento" | "embalagem" | "insumo"
  quantidadeEstoque: number
  unidadeMedida: string
  custoUnitario: number
  fornecedorId: string
  pontoReposicao: number
  dataValidade?: string
  observacoes?: string
}

export interface Fornecedor {
  id: string
  nome: string
  telefone: string
  cnpj?: string
  endereco?: string
  condicoesPagamento?: string
  observacoes?: string
}

export interface Movimentacao {
  id: string
  produtoId: string
  tipo: "entrada" | "saida"
  quantidade: number
  custoUnitario?: number
  fornecedorId?: string
  data: string
  observacoes?: string
  numeroPedido?: string
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>("isAuthenticated", false)
  const [produtos, setProdutos] = useMongoSync<Produto[]>("produtos", [])
  const [fornecedores, setFornecedores] = useMongoSync<Fornecedor[]>("fornecedores", [])
  const [movimentacoes, setMovimentacoes] = useMongoSync<Movimentacao[]>("movimentacoes", [])
  const [activeTab, setActiveTab] = useState("dashboard")
  
  const [searchTermProdutos, setSearchTermProdutos] = useState("")
  const [searchTermFornecedores, setSearchTermFornecedores] = useState("")

  const produtosFiltrados = produtos.filter((p) => 
    p.nome.toLowerCase().includes(searchTermProdutos.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTermProdutos.toLowerCase())
  )

  const fornecedoresFiltrados = fornecedores.filter((f) => 
    f.nome.toLowerCase().includes(searchTermFornecedores.toLowerCase())
  )

  const produtosEstoqueBaixo = produtos.filter((p) => p.quantidadeEstoque <= p.pontoReposicao)
  const totalProdutos = produtos.length
  const totalFornecedores = fornecedores.length
  const valorTotalEstoque = produtos.reduce((total, p) => total + p.quantidadeEstoque * p.custoUnitario, 0)

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tigre Açaí - Sistema de Gestão</h1>
            <p className="text-gray-600 mt-2">Controle completo do seu estoque e pedidos</p>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalProdutos}</div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Produtos Cadastrados</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-4 mb-4">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Pesquisar produto..." 
                      value={searchTermProdutos}
                      onChange={(e) => setSearchTermProdutos(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    {produtosFiltrados.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Nenhum produto encontrado.</p>
                    ) : (
                      produtosFiltrados.map(p => (
                        <div key={p.id} className="p-3 border rounded flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{p.nome}</p>
                            <p className="text-xs text-gray-500">{p.categoria} - R$ {p.custoUnitario}</p>
                          </div>
                          <Badge>{p.quantidadeEstoque} {p.unidadeMedida}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalFornecedores}</div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Fornecedores Cadastrados</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-4 mb-4">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Pesquisar fornecedor..." 
                      value={searchTermFornecedores}
                      onChange={(e) => setSearchTermFornecedores(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    {fornecedoresFiltrados.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Nenhum fornecedor encontrado.</p>
                    ) : (
                      fornecedoresFiltrados.map(f => (
                        <div key={f.id} className="p-3 border rounded flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{f.nome}</p>
                            <p className="text-xs text-gray-500">{f.telefone} {f.cnpj ? `- CNPJ: ${f.cnpj}` : ''}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {valorTotalEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{produtosEstoqueBaixo.length}</div>
                </CardContent>
              </Card>
            </div>

            {produtosEstoqueBaixo.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Produtos com Estoque Baixo
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Os seguintes produtos atingiram o ponto de reposição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {produtosEstoqueBaixo.map((produto) => {
                      const fornecedor = fornecedores.find((f) => f.id === produto.fornecedorId)
                      return (
                        <div
                          key={produto.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div>
                            <h4 className="font-medium">{produto.nome}</h4>
                            <p className="text-sm text-gray-600">
                              Estoque: {produto.quantidadeEstoque} {produto.unidadeMedida} | Ponto de Reposição:{" "}
                              {produto.pontoReposicao} {produto.unidadeMedida}
                            </p>
                            <p className="text-sm text-gray-500">Fornecedor: {fornecedor?.nome || "Não definido"}</p>
                          </div>
                          <Badge variant="destructive">Baixo</Badge>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => setActiveTab("pedidos")} className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Fazer Pedidos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Movimentações Recentes</CardTitle>
                <CardDescription>Últimas 5 movimentações de estoque</CardDescription>
              </CardHeader>
              <CardContent>
                {movimentacoes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
                ) : (
                  <div className="space-y-3">
                    {movimentacoes
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .slice(0, 5)
                      .map((mov) => {
                        const produto = produtos.find((p) => p.id === mov.produtoId)
                        return (
                          <div key={mov.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{produto?.nome || "Produto não encontrado"}</h4>
                              <p className="text-sm text-gray-600">
                                {mov.tipo === "entrada" ? "Entrada" : "Saída"}: {mov.quantidade}{" "}
                                {produto?.unidadeMedida}
                              </p>
                              <p className="text-sm text-gray-500">{new Date(mov.data).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <Badge variant={mov.tipo === "entrada" ? "default" : "secondary"}>
                              {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos">
            <ProdutoForm produtos={produtos} setProdutos={setProdutos} fornecedores={fornecedores} />
          </TabsContent>

          <TabsContent value="fornecedores">
            <FornecedorForm fornecedores={fornecedores} setFornecedores={setFornecedores} />
          </TabsContent>

          <TabsContent value="estoque">
            <EstoqueManager
              produtos={produtos}
              setProdutos={setProdutos}
              fornecedores={fornecedores}
              movimentacoes={movimentacoes}
              setMovimentacoes={setMovimentacoes}
            />
          </TabsContent>

          <TabsContent value="pedidos">
            <PedidosManager
              produtos={produtos}
              fornecedores={fornecedores}
              produtosEstoqueBaixo={produtosEstoqueBaixo}
            />
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosManager produtos={produtos} fornecedores={fornecedores} movimentacoes={movimentacoes} />
          </TabsContent>

        </Tabs>
      </div>
          <ChatWidget produtos={produtos} setProdutos={setProdutos} movimentacoes={movimentacoes} fornecedores={fornecedores} />
    </div>
  )
}