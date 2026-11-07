"use client"
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientes } from "@/services/clienteService";
import { toast } from "sonner";

import { ClienteCard } from "@/components/clientes/ClienteCard";
import { ClienteFormModal } from "@/components/clientes/ClienteFormModal";
import { ClienteViewModal } from "@/components/clientes/ClienteViewModal";
import { ClienteDeleteModal } from "@/components/clientes/ClienteDeleteModal";
import { PageHeader } from "@/components/PageHeader";

export default function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [limit] = useState(8);
    const [pagination, setPagination] = useState(null);
    const [search, setSearch] = useState("");
    const [pesquisaDebounced, setPesquisaDebounced] = useState("");

    const [openForm, setOpenForm] = useState(false);
    const [openVer, setOpenVer] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    const carregarClientes = useCallback(async (pageParam, searchParam) => {
        try {
            setLoading(true);
            const resp = await getClientes({ page: pageParam, limit, search: searchParam });
            const data = resp?.data ?? resp;
            setClientes(Array.isArray(data) ? data : []);
            setPagination(resp?.pagination ?? null);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar clientes");
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Efeito de Debounce (espera o usuário parar de digitar)
    useEffect(() => {
        const handler = setTimeout(() => {
            setPesquisaDebounced(search);
            setPage(1); // Reseta para a página 1 em nova busca
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    // Gatilho que dispara a busca
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void carregarClientes(page, pesquisaDebounced);
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [carregarClientes, page, pesquisaDebounced]);

    const handleAbrirCriar = () => {
        setClienteSelecionado(null);
        setOpenForm(true);
    };

    const handleAbrirAcao = (cliente, setModalOpen) => {
        setClienteSelecionado(cliente);
        setModalOpen(true);
    };

    return (
        <div className="flex flex-col w-full pb-10">
            <PageHeader
                eyebrow="Cadastro"
                title="Clientes"
                description="Gerencie cadastros, contatos e consultas rápidas da base de clientes."
                actions={(
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 transition-all duration-200 p-5 rounded-lg font-semibold shadow-lg shadow-orange-500/20"
                        onClick={handleAbrirCriar}
                    >
                        + Novo Cliente
                    </Button>
                )}
            />

            {/* Barra de Busca */}
            <div className="flex flex-col md:flex-row px-4 md:px-8 lg:px-13 pt-6 gap-3">
                <Input
                    placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                    className="w-full md:max-w-md p-5 transition-all bg-card border border-border text-foreground hover:border-orange-500 focus:border-orange-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Listagem de Cards */}
            <div className="flex flex-wrap gap-4 p-4 md:p-8 lg:p-13 justify-center lg:justify-start">
                {loading ? (
                    Array.from({ length: limit }).map((_, idx) => (
                        <div key={idx} className="w-full sm:w-[48%] lg:w-80 min-h-[280px] p-4 bg-card border border-border rounded-xl">
                            <Skeleton className="h-10 w-10 mb-4 bg-card" />
                            <Skeleton className="h-6 w-3/4 mb-2 bg-card" />
                            <Skeleton className="h-4 w-1/2 bg-card" />
                        </div>
                    ))
                ) : (
                    clientes.map((cliente) => (
                        <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            onView={() => handleAbrirAcao(cliente, setOpenVer)}
                            onEdit={() => handleAbrirAcao(cliente, setOpenForm)}
                            onDelete={() => handleAbrirAcao(cliente, setOpenDelete)}
                        />
                    ))
                )}

                {!loading && clientes.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl bg-card mt-4">
                        <p className="text-muted-foreground text-base italic font-medium">
                            Nenhum Cliente encontrado.
                        </p>
                    </div>
                )}
            </div>

            {/* Paginação */}
            {!loading && (
                <div className="flex items-center justify-center gap-3 px-4 md:px-8 lg:px-13">
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
                        {pagination?.totalPages ? (
                            <> de <span className="text-foreground font-semibold">{pagination.totalPages}</span></>
                        ) : null}
                    </div>
                    <Button
                        variant="outline"
                        className="bg-card border-border"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={(pagination?.totalPages && page >= pagination.totalPages) || (!pagination?.totalPages && clientes.length < limit)}
                    >
                        Próxima
                    </Button>
                </div>
            )}

            {/* Modais Isolados */}
            <ClienteFormModal
                key={`${openForm ? "open" : "closed"}-${clienteSelecionado?.id ?? "novo"}`}
                isOpen={openForm}
                onClose={() => setOpenForm(false)}
                clienteAtual={clienteSelecionado}
                refreshList={() => carregarClientes(page, pesquisaDebounced)}
            />

            <ClienteViewModal
                isOpen={openVer}
                onClose={() => setOpenVer(false)}
                cliente={clienteSelecionado} onEdit={() => setOpenForm(true)}
            />

            <ClienteDeleteModal
                key={`${openDelete ? "open" : "closed"}-${clienteSelecionado?.id ?? "none"}`}
                isOpen={openDelete}
                onClose={() => setOpenDelete(false)}
                cliente={clienteSelecionado}
                refreshList={() => carregarClientes(page, pesquisaDebounced)}
            />
        </div>
    );
}
