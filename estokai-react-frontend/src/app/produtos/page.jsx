"use client"
import Image from "next/image"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton"
import { getProdutos } from "@/services/produtosService"
import { subscribeToDataChanges } from "@/services/socket"
import { getTodosFornecedores } from "@/services/fornecedoresService"
import { useEffect, useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Trash2, FilePenLine, Eye, EyeOff, X, ZoomIn } from 'lucide-react';
import { toast } from "sonner"

import { ProdutoFormModal } from "@/components/produtos/ProdutoFormModal";
import { ProdutoViewModal } from "@/components/produtos/ProdutoViewModal";
import { ProdutoDeleteModal } from "@/components/produtos/ProdutoDeleteModal";
import { PageHeader } from "@/components/PageHeader";

export default function ProdutosPage() {
    const [todosProdutos, setTodosProdutos] = useState([])
    const [fornecedores, setFornecedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [limit] = useState(8)
    const [pagination, setPagination] = useState(null)
    const [filtro, setFiltro] = useState("Todos")
    const [pesquisa, setPesquisa] = useState("")
    const [pesquisaDebounced, setPesquisaDebounced] = useState("")

    const [openForm, setOpenForm] = useState(false)
    const [openVer, setOpenVer] = useState(false)
    const [openDelete, setOpenDelete] = useState(false)
    const [produtoSelecionado, setProdutoSelecionado] = useState(null)

    // Estado do lightbox
    const [imagemAmpliada, setImagemAmpliada] = useState(null)
    const [imagemAlt, setImagemAlt] = useState("")

    // Visibilidade do preço de custo
    const [mostrarCusto, setMostrarCusto] = useState(false)

    // Fechar lightbox com tecla Escape
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") setImagemAmpliada(null)
    }, [])

    useEffect(() => {
        if (imagemAmpliada) {
            document.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden"
        } else {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [imagemAmpliada, handleKeyDown])

    const carregarProdutos = useCallback(async (pageParam, searchParam) => {
        try {
            setLoading(true);

            const resp = await getProdutos({
                page: pageParam,
                limit,
                search: searchParam,
                filtro
            });

            setTodosProdutos(resp.data);
            setPagination(resp.pagination);

        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar produtos.");
        } finally {
            setLoading(false);
        }
    }, [filtro, limit])

    useEffect(() => {
        const handler = setTimeout(() => {
            setPesquisaDebounced(pesquisa)
            setPage(1)
        }, 400)
        return () => clearTimeout(handler)
    }, [pesquisa])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void carregarProdutos(page, pesquisaDebounced)
        }, 0)
        return () => clearTimeout(timeoutId)
    }, [carregarProdutos, page, pesquisaDebounced, filtro])

    useEffect(() => {
        return subscribeToDataChanges(["produtos"], () => {
            void carregarProdutos(page, pesquisaDebounced)
        })
    }, [carregarProdutos, page, pesquisaDebounced, filtro])

    useEffect(() => {
        async function carregarFornecedores() {
            try {
                const data = await getTodosFornecedores();
                setFornecedores(data);
            } catch (err) {
                console.error(err);
            }
        }

        carregarFornecedores();
    }, []);


    const handleAbrirAcao = (produto, setModalOpen) => {
        setProdutoSelecionado(produto);
        setModalOpen(true);
    };

    const handleAbrirImagem = (url, alt) => {
        setImagemAlt(alt)
        setImagemAmpliada(url)
    }

    return (
        <div className="flex flex-col w-full">
            <PageHeader
                eyebrow="Catálogo"
                title="Produtos"
                description="Visualize estoque, fornecedores, custos e disponibilidade operacional do catálogo."
                actions={(
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 transition-all duration-200 p-5 rounded-lg font-semibold shadow-lg shadow-orange-500/20"
                        onClick={() => handleAbrirAcao(null, setOpenForm)}
                    >
                        + Novo Produto
                    </Button>
                )}
            />

            <div className="flex flex-col md:flex-row px-4 md:px-8 lg:px-13 pt-6 gap-3">
                <Input
                    placeholder="Pesquisar produto no banco..."
                    className="w-full md:flex-1 p-5 transition-all bg-card border border-border text-foreground hover:border-orange-500 hover:text-orange-500"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />
                {["Todos", "Critico", "Normal"].map((item) => (
                    <button
                        key={item}
                        onClick={() => {
                            setFiltro(item)
                            setPage(1)
                        }}
                        className={`px-4 py-2 rounded-lg border transition-all ${filtro === item
                            ? "border-orange-500 text-orange-500 bg-orange-500/10"
                            : "border-border text-muted-foreground hover:border-orange-500 hover:text-orange-500"
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-4 px-4 md:px-8 lg:px-13 pt-5">
                <div className="flex-3 w-full">
                    <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-card">
                                    <TableRow className="px-6 py-4 uppercase tracking-wider text-muted-foreground">
                                        <TableHead className="text-muted-foreground text-xs tracking-wider pl-6">Imagem</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Produto / Marca</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Codigo do produto</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Fornecedor</TableHead>
                                        <TableHead
                                            className="text-muted-foreground text-xs tracking-wider cursor-pointer select-none hover:text-orange-500 transition-colors"
                                            onClick={() => setMostrarCusto((v) => !v)}
                                            title={mostrarCusto ? "Ocultar preço de custo" : "Revelar preço de custo"}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {mostrarCusto ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                Preço Custo
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Preço Unit.</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Peso</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Balança</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Estoque</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Min. Estoque</TableHead>
                                        <TableHead className="text-muted-foreground text-xs tracking-wider">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 8 }).map((_, idx) => (
                                            <TableRow key={`sk-${idx}`} className="border-b border-border">
                                                <TableCell className="pl-6 py-4"><Skeleton className="w-14 h-14 rounded-xl bg-card" /></TableCell>
                                                <TableCell><div className="flex flex-col gap-2"><Skeleton className="h-4 w-40 bg-card" /><Skeleton className="h-3 w-24 bg-card" /></div></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28 bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20 bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20 bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16 bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16 bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16 rounded-full bg-card" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-10 bg-card" /></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-9 w-9 rounded-md bg-card" />
                                                        <Skeleton className="h-9 w-9 rounded-md bg-card" />
                                                        <Skeleton className="h-9 w-9 rounded-md bg-card" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : todosProdutos.map((produto) => (
                                        <TableRow key={produto.id} className="border-b border-border hover:bg-card/40 transition-all">
                                            <TableCell className="pl-6 py-4">
                                                {/* Miniatura clicável para abrir lightbox */}
                                                <div
                                                    className={`w-14 h-14 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center group relative transition-all ${produto.imagemUrl ? "cursor-zoom-in hover:border-orange-500" : ""}`}
                                                    onClick={() => produto.imagemUrl && handleAbrirImagem(produto.imagemUrl, produto.descricao)}
                                                >
                                                    {produto.imagemUrl ? (
                                                        <>
                                                            <Image
                                                                src={produto.imagemUrl}
                                                                alt={produto.descricao}
                                                                width={56}
                                                                height={56}
                                                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                                            />
                                                            {/* Overlay com ícone de zoom ao hover */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl">
                                                                <ZoomIn className="w-5 h-5 text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs text-center leading-tight px-1">Vazio</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-semibold text-sm">{produto.descricao}</span>
                                                    <span className="text-muted-foreground text-xs mt-1">{produto.marca}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><span className="text-muted-foreground font-medium">{produto.codProduto}</span></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {produto.fornecedores?.map((v, index) => (
                                                        <span key={v.fornecedor?.id || index} className="text-foreground text-sm">{v.fornecedor?.nomeFantasia}</span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground font-medium tracking-widest select-none">
                                                    {mostrarCusto ? produto.precoCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ ••••••"}
                                                </span>
                                            </TableCell>
                                            <TableCell><span className="text-orange-500 font-bold">{produto.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></TableCell>
                                            <TableCell><span className="text-muted-foreground">{produto.peso != null ? `${Number(produto.peso).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg` : "—"}</span></TableCell>
                                            <TableCell><span className="text-muted-foreground">{produto.balancaId || "—"}</span></TableCell>
                                            <TableCell>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${produto.qtdEstoque < produto.qtdMinima
                                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                                                    }`}>
                                                    {produto.qtdEstoque}
                                                </span>
                                            </TableCell>
                                            <TableCell><span className="text-muted-foreground">{produto.qtdMinima}</span></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" className="bg-transparent border-zinc-700 hover:border-orange-500 hover:text-orange-500 cursor-pointer text-foreground transition-all" onClick={() => handleAbrirAcao(produto, setOpenVer)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button className="bg-amber-500 hover:bg-amber-600 text-foreground cursor-pointer transition-all" onClick={() => handleAbrirAcao(produto, setOpenForm)}>
                                                        <FilePenLine className="w-4 h-4" />
                                                    </Button>
                                                    <Button className="bg-red-500 hover:bg-red-600 text-foreground cursor-pointer transition-all" onClick={() => handleAbrirAcao(produto, setOpenDelete)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!loading && todosProdutos.length === 0 && (
                                        <tr>
                                            <td colSpan={11} className="text-center text-muted-foreground py-10 text-sm italic">
                                                Nenhum Produto encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>

            {!loading && (
                <div className="flex items-center justify-center gap-3 px-4 md:px-8 lg:px-13 pb-10 pt-6">
                    <Button
                        variant="outline"
                        className="bg-card border-border"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Página <span className="text-foreground font-semibold">{page}</span>
                        {pagination?.totalPages && (
                            <>
                                {" "}
                                de{" "}
                                <span className="text-foreground font-semibold">
                                    {pagination.totalPages}
                                </span>
                            </>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        className="bg-card border-border"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= (pagination?.totalPages ?? 1)}
                    >
                        Próxima
                    </Button>
                </div>
            )}

            <ProdutoFormModal
                key={`form-${openForm ? "open" : "closed"}-${produtoSelecionado?.id ?? "novo"}`}
                isOpen={openForm}
                onClose={() => setOpenForm(false)}
                produtoAtual={produtoSelecionado}
                fornecedores={fornecedores}
                refreshList={() => carregarProdutos(page, pesquisaDebounced)}
            />
            <ProdutoViewModal
                key={`view-${openVer ? "open" : "closed"}-${produtoSelecionado?.id ?? "none"}`}
                isOpen={openVer}
                onClose={() => setOpenVer(false)}
                onEdit={() => setOpenForm(true)}
                produto={produtoSelecionado}
            />
            <ProdutoDeleteModal
                key={`delete-${openDelete ? "open" : "closed"}-${produtoSelecionado?.id ?? "none"}`}
                isOpen={openDelete}
                onClose={() => setOpenDelete(false)}
                produto={produtoSelecionado}
                refreshList={() => carregarProdutos(page, pesquisaDebounced)}
            />

            {/* Lightbox de imagem ampliada */}
            {imagemAmpliada && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    onClick={() => setImagemAmpliada(null)}
                >
                    {/* Botão fechar */}
                    <button
                        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-zinc-800/90 border border-zinc-700 text-white flex items-center justify-center hover:bg-zinc-700 hover:border-orange-500 transition-all duration-200"
                        onClick={() => setImagemAmpliada(null)}
                        aria-label="Fechar imagem"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Dica de teclado */}
                    <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-zinc-400 text-xs select-none">
                        Pressione <kbd className="bg-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> ou clique fora para fechar
                    </span>

                    {/* Imagem — stopPropagation para não fechar ao clicar nela */}
                    <div
                        className="relative max-w-[90vw] max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={imagemAmpliada}
                            alt={imagemAlt}
                            width={1400}
                            height={1400}
                            className="max-w-[90vw] max-h-[85vh] h-auto w-auto rounded-2xl border border-zinc-700 object-contain shadow-2xl"
                            style={{ animation: "lightboxIn 0.2s ease" }}
                        />
                        {imagemAlt && (
                            <p className="text-center text-zinc-400 text-sm mt-3 select-none">{imagemAlt}</p>
                        )}
                    </div>

                    <style>{`
                        @keyframes lightboxIn {
                            from { opacity: 0; transform: scale(0.93); }
                            to   { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
