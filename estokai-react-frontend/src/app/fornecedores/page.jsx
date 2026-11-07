"use client"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { getFornecedores } from "@/services/fornecedoresService";
import { toast } from "sonner";
import { FornecedorCard } from "@/components/fornecedores/FornecedorCard";
import { FornecedorFormModal } from "@/components/fornecedores/FornecedorFormModal";
import { FornecedorViewModal } from "@/components/fornecedores/FornecedorViewModal";
import { FornecedorDeleteModal } from "@/components/fornecedores/FornecedorDeleteModal";
import { PageHeader } from "@/components/PageHeader";

export default function FornecedoresPage() {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [limit] = useState(8);
    const [pagination, setPagination] = useState(null);
    const [search, setSearch] = useState("");
    const [pesquisaDebounced, setPesquisaDebounced] = useState("");

    const [openForm, setOpenForm] = useState(false);
    const [openVer, setOpenVer] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

    // Função que chama o Backend com Paginação e Busca
    const carregarFornecedores = useCallback(async (pageParam, searchParam) => {
        try {
            setLoading(true);
            const resp = await getFornecedores({ page: pageParam, limit, search: searchParam });
            const data = resp?.data ?? resp;
            setFornecedores(Array.isArray(data) ? data : []);
            setPagination(resp?.pagination ?? null);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar fornecedores");
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Debounce: Aguarda 400ms após o usuário parar de digitar
    useEffect(() => {
        const handler = setTimeout(() => {
            setPesquisaDebounced(search);
            setPage(1); // Reseta a página para 1 em uma nova pesquisa
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    // Dispara a busca sempre que a página ou a pesquisa mudarem
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void carregarFornecedores(page, pesquisaDebounced);
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [carregarFornecedores, page, pesquisaDebounced]);

    const handleAbrirAcao = (fornecedor, setModalOpen) => {
        setFornecedorSelecionado(fornecedor);
        setModalOpen(true);
    };

    return (
        <div className="flex flex-col pb-10">
            <PageHeader
                eyebrow="Cadastro"
                title="Fornecedores"
                description="Acompanhe parceiros, dados fiscais e relacionamento com a cadeia de abastecimento."
                actions={(
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 transition-all duration-200 p-5 rounded-lg font-semibold shadow-lg shadow-orange-500/20"
                        onClick={() => handleAbrirAcao(null, setOpenForm)}
                    >
                        + Novo Fornecedor
                    </Button>
                )}
            />

            {/* Barra de Busca */}
            <div className="flex flex-col md:flex-row px-4 md:px-8 lg:px-13 pt-6 gap-3">
                <Input
                    placeholder="Buscar por Nome Fantasia, Razão Social ou CNPJ..."
                    className="w-full md:max-w-md p-5 transition-all bg-card border border-border text-foreground hover:border-orange-500 focus:border-orange-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Listagem (Skeletons ou Cards) */}
            <div className="flex flex-wrap gap-4 p-4 md:p-8 lg:p-13 justify-center lg:justify-start">
                {loading ? (
                    Array.from({ length: limit }).map((_, idx) => (
                        <div key={idx} className="w-full sm:w-[48%] lg:w-80">
                            <Card className="min-h-[320px] background-sidebar border border-zinc-600 border-t-3 border-t-orange-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex justify-between items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-lg bg-card" />
                                        <Skeleton className="h-8 w-24 rounded-lg bg-card" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <Skeleton className="h-6 w-3/4 bg-card" />
                                    <Skeleton className="h-4 w-1/2 bg-card" />
                                    <Skeleton className="h-4 w-2/3 bg-card" />
                                    <Skeleton className="h-4 w-1/2 bg-card" />
                                </CardContent>
                                <CardFooter className="gap-3 flex justify-end flex-wrap background-main">
                                    <Skeleton className="h-10 flex-1 min-w-[120px] bg-card" />
                                    <Skeleton className="h-10 w-12 bg-card" />
                                </CardFooter>
                            </Card>
                        </div>
                    ))
                ) : (
                    fornecedores.map((fornecedor) => (
                        <FornecedorCard
                            key={fornecedor.id}
                            fornecedor={fornecedor}
                            onView={() => handleAbrirAcao(fornecedor, setOpenVer)}
                            onEdit={() => handleAbrirAcao(fornecedor, setOpenForm)}
                            onDelete={() => handleAbrirAcao(fornecedor, setOpenDelete)}
                        />
                    ))
                )}

                {!loading && fornecedores.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl bg-card">
                        <p className="text-muted-foreground text-base italic font-medium">
                            Nenhum Fornecedor encontrado.
                        </p>
                    </div>
                )}
            </div>

            {/* Paginação */}
            {!loading && (
                <div className="flex items-center justify-center gap-3 px-4 md:px-8 lg:px-13">
                    <Button
                        variant="outline"
                        className="background-sidebar border-border"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Página <span className="text-foreground font-semibold">{page}</span>
                        {pagination?.totalPages ? (
                            <> de <span className="text-foreground font-semibold">{pagination.totalPages}</span></>
                        ) : null}
                    </div>
                    <Button
                        variant="outline"
                        className="background-sidebar border-border"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={
                            (pagination?.totalPages && page >= pagination.totalPages) ||
                            (!pagination?.totalPages && fornecedores.length < limit)
                        }
                    >
                        Próxima
                    </Button>
                </div>
            )}

            {/* Modais Isolados */}
            <FornecedorFormModal
                key={`${openForm ? "open" : "closed"}-${fornecedorSelecionado?.id ?? "novo"}`}
                isOpen={openForm}
                onClose={() => setOpenForm(false)}
                fornecedorAtual={fornecedorSelecionado}
                refreshList={() => carregarFornecedores(page, pesquisaDebounced)}
            />

            <FornecedorViewModal
                isOpen={openVer}
                onClose={() => setOpenVer(false)}
                fornecedor={fornecedorSelecionado} onEdit={() => setOpenForm(true)}
            />

            <FornecedorDeleteModal
                key={`${openDelete ? "open" : "closed"}-${fornecedorSelecionado?.id ?? "none"}`}
                isOpen={openDelete}
                onClose={() => setOpenDelete(false)}
                fornecedor={fornecedorSelecionado}
                refreshList={() => carregarFornecedores(page, pesquisaDebounced)}
            />
        </div>
    );
}
