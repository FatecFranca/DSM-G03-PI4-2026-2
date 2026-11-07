"use client"

import Image from "next/image"
import { useEffect, useState, useEffectEvent } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { getMovimentacoes } from "@/services/movimentacaoService"
import { subscribeToDataChanges } from "@/services/socket"
import { ArrowDown, ArrowUp, Package } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"

export default function MovimentacaoPage() {
    const [movimentacoes, setMovimentacoes] = useState([])
    const [loading, setLoading] = useState(true)
    
    const [page, setPage] = useState(1)
    const [limit] = useState(15)
    const [pagination, setPagination] = useState(null)
    const [search, setSearch] = useState("")
    const [pesquisaDebounced, setPesquisaDebounced] = useState("")

    const carregarMovimentacoes = useEffectEvent(async (pageParam = page, searchParam = pesquisaDebounced) => {
        try {
            setLoading(true)
            const resp = await getMovimentacoes({ page: pageParam, limit, search: searchParam })
            const data = resp?.data ?? resp
            setMovimentacoes(Array.isArray(data) ? data : [])
            setPagination(resp?.pagination ?? null)
        } catch (error) {
            console.error("Erro ao carregar movimentações:", error)
            setMovimentacoes([])
        } finally {
            setLoading(false)
        }
    })

    // Efeito de Debounce (espera o usuário parar de digitar)
    useEffect(() => {
        const handler = setTimeout(() => {
            setPesquisaDebounced(search)
            setPage(1) // Reseta para a página 1 em nova busca
        }, 400)
        return () => clearTimeout(handler)
    }, [search])

    // Gatilho que dispara a busca no Backend
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void carregarMovimentacoes(page, pesquisaDebounced)
        }, 0)
        return () => clearTimeout(timeoutId)
    }, [page, pesquisaDebounced])

    useEffect(() => {
        return subscribeToDataChanges(["movimentacoes"], () => {
            void carregarMovimentacoes(page, pesquisaDebounced)
        })
    }, [page, pesquisaDebounced])

    return (
        <div className="flex flex-col w-full pb-10">
            <PageHeader
                eyebrow="Controle"
                title="Movimentações"
                description="Consulte entradas e saídas de estoque com rastreabilidade por produto, pedido e justificativa."
            />

            {/* Barra de Busca */}
            <div className="flex flex-col md:flex-row px-4 md:px-8 lg:px-13 pt-6 gap-3">
                <Input 
                    placeholder="Buscar por produto, justificativa ou pedido..." 
                    className="w-full md:max-w-md p-5 transition-all bg-card border border-border text-foreground hover:border-orange-500 focus:border-orange-500" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            {/* Tabela */}
            <div className="px-4 md:px-8 lg:px-13 pt-5">
                <Card className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-card border-b border-border">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider pl-6">Tipo</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider">Produto</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider">Quantidade</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider">Justificativa</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider">Pedido</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[11px] tracking-wider">Data</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {/* Estado de Carregamento */}
                                {loading && Array.from({ length: limit }).map((_, idx) => (
                                    <TableRow key={`sk-${idx}`} className="border-b border-border">
                                        <TableCell className="pl-6 py-4"><Skeleton className="h-6 w-24 rounded-full bg-card" /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-12 h-12 rounded-xl bg-card" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 bg-card" />
                                                    <Skeleton className="h-3 w-20 bg-card" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 bg-card" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40 bg-card" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 bg-card" /></TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24 bg-card" />
                                                <Skeleton className="h-3 w-16 bg-card" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Estado Vazio */}
                                {!loading && movimentacoes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10 italic text-sm">
                                            Nenhuma movimentação encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Dados Reais */}
                                {!loading && movimentacoes.map((movimentacao) => {
                                    const entrada = movimentacao.quantidade > 0;

                                    return (
                                        <TableRow key={movimentacao.id} className="border-b border-border hover:bg-card/40 transition-all">
                                            <TableCell className="pl-6 py-4">
                                                <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full text-xs font-semibold border ${entrada ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                                                    {entrada ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                    {entrada ? "ENTRADA" : "SAÍDA"}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center shrink-0">
                                                        {movimentacao.produto?.imagemUrl ? (
                                                            <Image
                                                                src={movimentacao.produto.imagemUrl}
                                                                alt={movimentacao.produto.descricao}
                                                                width={48} height={48}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-semibold text-sm">
                                                            {movimentacao.produto?.descricao}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs mt-1">
                                                            {movimentacao.produto?.marca}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className={`font-black text-sm ${entrada ? "text-green-400" : "text-red-400"}`}>
                                                    {entrada ? "+" : ""}
                                                    {movimentacao.quantidade}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                    {movimentacao.justificativa}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-orange-500 font-semibold">
                                                    {movimentacao.itemPedido?.pedido?.numPedido
                                                        ? `PED-${movimentacao.itemPedido.pedido.numPedido}`
                                                        : "-"
                                                    }
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-foreground text-sm">
                                                        {new Date(movimentacao.createdAt).toLocaleDateString("pt-BR")}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {new Date(movimentacao.createdAt).toLocaleTimeString("pt-BR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* Controles de Paginação */}
            {!loading && (
                <div className="flex items-center justify-center gap-3 px-4 md:px-8 lg:px-13 pt-6">
                    <Button variant="outline" className="bg-card border-border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                        Anterior
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Página <span className="text-foreground font-semibold">{page}</span>
                        {pagination?.totalPages && <> de <span className="text-foreground font-semibold">{pagination.totalPages}</span></>}
                    </div>
                    <Button variant="outline" className="bg-card border-border" onClick={() => setPage((p) => p + 1)} disabled={(pagination?.totalPages && page >= pagination.totalPages) || (!pagination?.totalPages && movimentacoes.length < limit)}>
                        Próxima
                    </Button>
                </div>
            )}
        </div>
    )
}
