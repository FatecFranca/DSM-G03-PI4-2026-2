"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getPedidos } from "@/services/pedidosService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PedidoCreateModal } from "@/components/pedidos/PedidoCreateModal";
import { PedidoViewModal } from "@/components/pedidos/PedidoViewModal";
import { PedidoEditModal } from "@/components/pedidos/PedidoEditModal";
import { subscribeToDataChanges } from "@/services/socket";
import { PageHeader } from "@/components/PageHeader";

const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function statusStyle(status) {
  switch (status) {
    case "Concluído": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "Pendente": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "Cancelado": return "bg-red-500/20 text-red-400 border border-red-500/30";
    default: return "bg-card/20 text-muted-foreground border border-border/30";
  }
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [pesquisaDebounced, setPesquisaDebounced] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [openVisualizar, setOpenVisualizar] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openCriar, setOpenCriar] = useState(false);

  // Função central que chama o backend
  const carregarPedidos = useCallback(async (pageParam, searchParam) => {
    try {
      setLoading(true);
      const resp = await getPedidos({ page: pageParam, limit, search: searchParam });
      const dados = resp?.data ?? resp;
      setPedidos(Array.isArray(dados) ? dados : []);
      setPagination(resp?.pagination ?? null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Efeito Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPesquisaDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Gatilho de recarregamento
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void carregarPedidos(page, pesquisaDebounced);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [carregarPedidos, page, pesquisaDebounced]);

  useEffect(() => {
    return subscribeToDataChanges(["pedidos"], () => {
      void carregarPedidos(page, pesquisaDebounced);
    });
  }, [carregarPedidos, page, pesquisaDebounced]);

  // Filtro puramente visual (Status)
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => filtro === "Todos" || pedido.status === filtro);
  }, [pedidos, filtro]);

  const acaoModal = (pedido, setModalOpen) => {
    setPedidoSelecionado(pedido);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full min-h-screen text-muted-foreground pb-10">

      <PageHeader
        eyebrow="Vendas"
        title="Pedidos"
        description="Acompanhe criação, edição e status dos pedidos com foco no fluxo comercial."
        actions={(
          <button
            onClick={() => setOpenCriar(true)}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold transition-all hover:bg-orange-600 cursor-pointer text-white shadow-lg shadow-orange-500/20"
          >
            + Novo Pedido
          </button>
        )}
      />

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row px-4 md:px-8 lg:px-13 pt-6 gap-3">
        <input
          type="text"
          placeholder="Buscar cliente ou pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:flex-1 p-5 rounded-lg border border-border bg-card transition-all outline-none focus:border-orange-500"
        />
        
        {/* BLOCO DE FILTROS ATUALIZADO */}
        {[
          { label: "Todos", value: "Todos" },
          { label: "Pendentes", value: "Pendente" },
          { label: "Concluídos", value: "Concluído" },
          { label: "Cancelados", value: "Cancelado" }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setFiltro(item.value)}
            className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${
              filtro === item.value
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-border text-muted-foreground hover:border-orange-500 hover:text-orange-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tabela de Pedidos */}
      <div className="flex flex-wrap gap-4 px-4 md:px-8 lg:px-13 pt-5">
        <div className="flex-3 w-full">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card border-b border-border">
                  <tr>
                    {["Pedido", "Cliente", "Data", "Total", "Pagamento", "Status", "Ações"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: limit }).map((_, idx) => (
                    <tr key={`sk-${idx}`} className="border-t border-border">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-card" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-44 bg-card" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 bg-card" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-card" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-card" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full bg-card" /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-12 rounded-lg bg-card" />
                          <Skeleton className="h-8 w-14 rounded-lg bg-card" />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id} className="border-t border-border transition-all hover:bg-card/40">
                      <td className="px-6 py-4 font-semibold text-orange-500">PED-{pedido.numPedido}</td>
                      <td className="px-6 py-4">{pedido?.cliente?.nomeRazaoSocial}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 font-semibold">{moeda(pedido.valorTotal)}</td>
                      <td className="px-6 py-4">{pedido.formaPagamento}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => acaoModal(pedido, setOpenVisualizar)}
                            className="rounded-lg border border-blue-500/30 px-3 py-1 text-sm text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all"
                          >
                            Ver
                          </button>
                          {pedido.status === "Pendente" && (
                            <button
                              onClick={() => acaoModal(pedido, setOpenEditar)}
                              className="rounded-lg border border-orange-500/30 px-3 py-1 text-sm text-orange-400 hover:bg-orange-500/10 cursor-pointer transition-all"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && pedidosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground py-10 text-sm italic">
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Paginação */}
      {!loading && (
        <div className="flex items-center justify-center gap-3 px-4 md:px-8 lg:px-13 pt-6">
          <Button variant="outline" className="bg-card border-border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
          <div className="text-sm text-muted-foreground">
            Página <span className="text-foreground font-semibold">{page}</span>
            {pagination?.totalPages && <> de <span className="text-foreground font-semibold">{pagination.totalPages}</span></>}
          </div>
          <Button variant="outline" className="bg-card border-border" onClick={() => setPage((p) => p + 1)} disabled={(pagination?.totalPages && page >= pagination.totalPages) || (!pagination?.totalPages && pedidos.length < limit)}>Próxima</Button>
        </div>
      )}

      {/* Modais Isolados */}
      <PedidoCreateModal key={openCriar ? "create-open" : "create-closed"} isOpen={openCriar} onClose={() => setOpenCriar(false)} refreshList={() => carregarPedidos(page, pesquisaDebounced)} />
      <PedidoViewModal isOpen={openVisualizar} onClose={() => setOpenVisualizar(false)} pedido={pedidoSelecionado} onEdit={() => setOpenEditar(true)} />
      <PedidoEditModal key={`${openEditar ? "open" : "closed"}-${pedidoSelecionado?.id ?? "none"}`} isOpen={openEditar} onClose={() => setOpenEditar(false)} pedido={pedidoSelecionado} refreshList={() => carregarPedidos(page, pesquisaDebounced)} />
    </div>
  );
}
