"use client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, Building2, TriangleAlert, ArrowBigUp } from "lucide-react"
import { getDashboardResumoCompleto } from "@/services/dashboardService" 
import { useEffect, useState, useEffectEvent } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { subscribeToDataChanges } from "@/services/socket"
import { useMounted } from "@/hooks/use-mounted"
import { PageHeader } from "@/components/PageHeader"

export default function DashBoardPage() {
  const router = useRouter()
  const mounted = useMounted()

  const [data, setData] = useState({
    produtos: 0,
    pedidos: 0,
    fornecedores: 0,
    clientes: 0,
    estoqueCritico: [],
    recentes: [],
    estoqueDia: [], 
    pedidosDia: [],
    clienteDia: [],
    fornecedoresDia: []
  })

  const horarioCliente = mounted
    ? new Date().toLocaleTimeString("pt-BR", {
        weekday: "long", day: "2-digit", month: "short",
        year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : ""

  function RegistarEntrada() {
    router.push("/entradas")
  }

  const carregarDashboard = useEffectEvent(async () => {
    try {
      const resumen = await getDashboardResumoCompleto();
      setData(resumen);
    } catch (error) {
      console.error("Erro ao carregar os dados do dashboard:", error);
    }
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void carregarDashboard()
    }, 0)

    const unsubscribe = subscribeToDataChanges(["dashboard"], () => {
      void carregarDashboard()
    })

    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [])

    return (
    <div className="flex flex-col ">
      <PageHeader
        eyebrow="Visao Geral"
        title="Dashboard"
        description="Monitore indicadores-chave, operacao recente e alertas do sistema em um unico painel."
        actions={(
          <div className="pr-15">
            <Card className="p-2 background-sidebar border border-border rounded-xa">
              <CardContent>
                {horarioCliente || "Carregando data..."}
              </CardContent>
            </Card>
          </div>
        )}
      />
      
      <div className="flex flex-wrap gap-4 pt-13 pl-13 pr-13">
        <div className="flex-4">
          <Card className="w4/10 bg-card border border-border border-t-3 border-t-orange-500">
            <CardHeader>
              <CardTitle className="flex justify-between ">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Package className="text-orange-500" size={20} />
                </div>
                <span className="flex items-center justify-center text-xs font-semibold text-green-600 bg-green-600/15 px-2 py-1 rounded-full">
                  + {data.estoqueDia.length ?? 0} hoje
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-center pb-2 h-12">
              <div className="mt-13 text-orange-500">{data.produtos}</div>
            </CardContent>
            <CardFooter className="bg-card">
              Produtos em estoque
            </CardFooter>
          </Card>
        </div>
        <div className="flex-4">
          <Card className="w4/10 bg-card border border-border border-t-3 border-t-orange-500">
            <CardHeader>
              <CardTitle className="flex justify-between ">
                <div className="bg-green-700/20 p-2 rounded-lg">
                  <ShoppingCart className="text-green-700" size={20} />
                </div>
                <span className="flex items-center justify-center text-xs font-semibold text-green-600 bg-green-600/15 px-2 py-1 rounded-full">
                  + {data.pedidosDia.length ?? 0} hoje
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-center pb-2 h-12">
              <div className="mt-13 text-green-700">{data.pedidos}</div>
            </CardContent>
            <CardFooter className="bg-card ">
              Pedidos do Mês
            </CardFooter>
          </Card>
        </div>
        <div className="flex-4">
          <Card className="w4/10 bg-card border border-border border-t-3 border-t-orange-500">
            <CardHeader>
              <CardTitle className="flex justify-between ">
                <div className="bg-purple-700/20 p-2 rounded-lg">
                  <Users className="text-purple-700" size={20} />
                </div>
                <span className="flex items-center justify-center text-xs font-semibold text-green-600 bg-green-600/15 px-2 py-1 rounded-full">
                  + {data.clienteDia.length ?? 0} hoje
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-center pb-2 h-12">
              <div className="mt-13 text-purple-700">{data.clientes}</div>
            </CardContent>
            <CardFooter className="bg-card">
              Clientes Ativos
            </CardFooter>
          </Card>
        </div>
        <div className="flex-4">
          <Card className="w4/10 bg-card border border-border border-t-3 border-t-orange-500">
            <CardHeader>
              <CardTitle className="flex justify-between ">
                <div className="bg-cyan-700/20 p-2 rounded-lg">
                  <Building2 className="text-cyan-700" size={20} />
                </div>
                <span className="flex items-center justify-center text-xs font-semibold text-green-600 bg-green-600/15 px-2 py-1 rounded-full">
                  + {data.fornecedoresDia.length ?? 0} hoje
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-center pb-2 h-12">
              <div className="mt-13 text-cyan-700">{data.fornecedores}</div>
            </CardContent>
            <CardFooter className="bg-card">
              Fornecedores
            </CardFooter>
          </Card>
        </div>
      </div>
      <div>
        <div className="flex flex-col xl:flex-row gap-4 p-4 xl:p-13">
          <div className="w-full xl:flex-[3] min-w-0">
            <Card className="bg-card border border-border border-t-3 border-t-orange-500 h-[420px] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
                <div>
                  <h1 className="text-foreground text-xl font-bold">
                    Todos os Pedidos
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Últimos pedidos registrados no sistema
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/pedidos")}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer">
                  Ver Todos os Pedidos
                </Button>
              </div>
              <div className="overflow-auto h-full">
                 <Table className="min-w-[700px]">
                  <TableHeader className="bg-card sticky top-0 z-10">
                    <TableRow className="border-b border-border hover:bg-card">
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs pl-6">
                        Pedido
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">
                        Cliente
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">
                        Valor
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">
                        Data
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentes.map((pedido) => (
                      <TableRow
                        key={pedido.id}
                        className="border-b border-border hover:bg-zinc-900/40 transition-all">
                        <TableCell className="pl-6 font-semibold text-orange-500">
                          PED-{pedido.numPedido}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {pedido?.cliente?.nomeRazaoSocial}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {Number(pedido.valorTotal).toLocaleString(
                            "pt-BR",
                            {
                              style: "currency",
                              currency: "BRL",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {new Date(
                            pedido.createdAt
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
          <div className="w-full xl:flex-1">
            <Card className="w2.5/10 h-105 bg-card border border-border border-t-3 border-t-red-500">
              <CardHeader className=' border-b border-border pb-4'>
                <CardTitle className="flex justify-start gap-5">
                  <TriangleAlert className="text-red-500"></TriangleAlert>
                  <div className="text-red-500">Estoque Critico</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-60 overflow-y-auto flex flex-col gap-3 pt-2">
                {data.estoqueCritico.map((produto) => {
                  const porcentagem = Math.min((produto.qtdEstoque / produto.qtdMinima) * 100, 100);
                  const corTexto =
                    porcentagem <= 30 ? "text-red-500" : "text-yellow-500";
                  const corBarra =
                    porcentagem <= 30 ? "bg-red-500" : "bg-yellow-500";
                  return (
                    <div key={produto.id} className="bg-card border border-border rounded-lg p-3">
                      <p className="text-sm text-foreground font-medium mb-2 leading-tight">
                        {produto.descricao}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${corBarra}`}
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${corTexto}`}>
                          {produto.qtdEstoque}/{produto.qtdMinima}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="bg-card mt-10">
                <Button variant="outline" className="w-full bg-card cursor-pointer hover:border-orange-500 hover:text-orange-500 group" onClick={RegistarEntrada}>
                  <ArrowBigUp className="w-4 h-4 mr-2 group-hover:text-orange-700" />
                  <span className=" group-hover:text-orange-700 ">Registrar Entrada</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
