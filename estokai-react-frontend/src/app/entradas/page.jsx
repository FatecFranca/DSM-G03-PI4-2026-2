"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getProdutos } from "@/services/produtosService";
import { createMovimentacao } from "@/services/movimentacaoService";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, CheckCircle2, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { subscribeToDataChanges } from "@/services/socket";
import { PageHeader } from "@/components/PageHeader";

export default function EntradasPage() {
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [formData, setFormData] = useState({ quantidade: 1, justificativa: "" });
  const [openConfirmar, setOpenConfirmar] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1); // Volta pra página 1 ao fazer nova busca
    }, 400);
    return () => clearTimeout(handler);
  }, [busca]);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getProdutos({ page, limit: 5, search: buscaDebounced });
      const data = resp?.data ?? resp;
      setProdutos(Array.isArray(data) ? data : []);
      setPagination(resp?.pagination ?? null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [buscaDebounced, page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void carregarProdutos();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [carregarProdutos, page, buscaDebounced]);

  useEffect(() => {
    return subscribeToDataChanges(["produtos"], () => {
      void carregarProdutos();
    });
  }, [carregarProdutos, page, buscaDebounced]);

  const handleSelecionarProduto = (produto) => {
    setProdutoSelecionado(produto);
    setFormData({ quantidade: 1, justificativa: "" });
  };

  async function registrarEntrada() {
    if (!produtoSelecionado) return toast.error("Selecione um produto");
    if (formData.quantidade <= 0) return toast.error("Quantidade inválida");

    try {
      setLoadingSalvar(true);
      await createMovimentacao({
        produtoId: produtoSelecionado.id,
        quantidade: Number(formData.quantidade),
        justificativa: formData.justificativa || "Entrada manual",
      });

      toast.success("Entrada registrada com sucesso!");
      setOpenConfirmar(false);

      // Reseta form e recarrega a lista para atualizar o estoque na tela
      setProdutoSelecionado(null);
      setFormData({ quantidade: 1, justificativa: "" });
      void carregarProdutos();

    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Erro ao registrar entrada");
    } finally {
      setLoadingSalvar(false);
    }
  }

  return (
    <div className="min-h-screen text-muted-foreground pl-13 pr-13 pb-10">
      <PageHeader
        eyebrow="Estoque"
        title="Entradas de Produtos"
        description="Registre reposições manuais e acompanhe o impacto imediato no saldo dos itens."
        className="px-0"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Lado Esquerdo: Lista de Produtos*/}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-6 h-fit flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">Localizar Produto</h2>

          {/* Input de Busca */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Pesquise por nome ou marca..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-4 text-base text-foreground outline-none focus:border-orange-500 transition-all"
            />
          </div>

          {/* Lista Permanente */}
          <div className="flex flex-col gap-2 min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-60">
                <Package className="w-16 h-16 mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              produtos.map((produto) => {
                const isSelected = produtoSelecionado?.id === produto.id;
                return (
                  <div
                    key={produto.id}
                    onClick={() => handleSelecionarProduto(produto)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                        ? "border-orange-500 bg-orange-500/10 shadow-sm"
                        : "border-border bg-background hover:border-orange-500/50"
                      }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {produto.imagemUrl ? (
                        <Image src={produto.imagemUrl} alt={produto.descricao} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-muted-foreground" size={24} />
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className={`font-semibold ${isSelected ? "text-orange-500" : "text-foreground"}`}>
                        {produto.descricao}
                      </span>
                      <span className="text-sm text-muted-foreground">{produto.marca}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block">Estoque</span>
                      <span className="font-bold text-foreground text-lg">{produto.qtdEstoque}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginação */}
          {!loading && produtos.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
              <Button
                variant="outline"
                className="bg-background border-border"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página <span className="font-semibold text-foreground">{page}</span>
                {pagination?.totalPages && <> de <span className="font-semibold text-foreground">{pagination.totalPages}</span></>}
              </span>
              <Button
                variant="outline"
                className="bg-background border-border"
                onClick={() => setPage(p => p + 1)}
                disabled={pagination?.totalPages ? page >= pagination.totalPages : produtos.length < 5}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>

        {/* Lado Direito: Formulário*/}
        <div className="rounded-xl border border-border bg-card p-6 h-fit sticky top-6">
          <h1 className="text-xl font-bold text-foreground mb-6">Configurar Entrada</h1>

          {!produtoSelecionado ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground bg-background/50">
              Selecione um produto na lista ao lado para habilitar o formulário.
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="rounded-xl bg-background p-4 border border-border">
                <div className="text-xs text-muted-foreground uppercase">Produto Selecionado</div>
                <div className="font-semibold text-foreground mt-1 text-lg">{produtoSelecionado.descricao}</div>
                <div className="text-sm text-muted-foreground mt-1">Estoque atual: <span className="font-bold text-foreground">{produtoSelecionado.qtdEstoque}</span></div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Quantidade da Entrada</label>
                <input
                  type="number" min={1}
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-4 text-foreground outline-none focus:border-orange-500 transition-all font-bold text-lg"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Justificativa (Opcional)</label>
                <textarea
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  placeholder="Ex: Nota Fiscal nº 4520, ajuste de estoque..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-4 text-foreground outline-none focus:border-orange-500 resize-none h-28 transition-all"
                />
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 mb-4">
                <div className="text-sm text-green-400 font-medium">Estoque após entrada</div>
                <div className="text-4xl font-black text-foreground mt-1">
                  {produtoSelecionado.qtdEstoque + Number(formData.quantidade || 0)}
                </div>
              </div>

              <button
                onClick={() => setOpenConfirmar(true)}
                disabled={loadingSalvar}
                className="w-full rounded-xl bg-green-600 hover:bg-green-500 text-white h-14 font-bold text-base transition-all cursor-pointer shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {loadingSalvar ? "Registrando..." : "Registrar Entrada"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      <AlertDialog open={openConfirmar} onOpenChange={setOpenConfirmar}>
        <AlertDialogContent className="bg-card border border-border p-8">
          <AlertDialogTitle className="text-2xl font-bold text-foreground mb-6">Confirmar Entrada</AlertDialogTitle>
          <div className="space-y-5">
            <div className="p-4 bg-background rounded-lg border border-border">
              <span className="text-xs text-muted-foreground uppercase">Produto</span>
              <p className="text-foreground font-medium mt-1">{produtoSelecionado?.descricao}</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <span className="text-xs text-muted-foreground uppercase">Quantidade a adicionar</span>
              <p className="text-3xl font-bold text-green-400 mt-1">+{formData.quantidade}</p>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <AlertDialogCancel
              disabled={loadingSalvar}
              className={`!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground transition-all flex items-center justify-center outline-none focus:ring-0 ${loadingSalvar ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              Cancelar
            </AlertDialogCancel>

            <button
              onClick={registrarEntrada}
              disabled={loadingSalvar}
              className={`!mt-0 h-11 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-all outline-none focus:ring-0 ${loadingSalvar
                  ? "bg-muted-foreground cursor-not-allowed opacity-70"
                  : "bg-green-600 hover:bg-green-500 cursor-pointer shadow-md"
                }`}
            >
              {loadingSalvar ? "Registrando..." : "Confirmar"}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
