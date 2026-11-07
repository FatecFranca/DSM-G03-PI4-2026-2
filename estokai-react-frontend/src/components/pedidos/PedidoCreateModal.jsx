import React, { useState, useMemo, useEffect, useEffectEvent } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createPedido, createItemPedido } from "@/services/pedidosService";
import { getTodosClientes } from "@/services/clienteService";
import { getProdutos } from "@/services/produtosService";

const MODAL_CLASSES = "bg-card border border-border !w-[96vw] !max-w-[96vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[84vw] xl:!max-w-[84vw] 2xl:!w-[78vw] 2xl:!max-w-[78vw] h-[92vh] overflow-y-auto p-8";
const FORMAS_PAGAMENTO = ["Distribuição", "Pix", "Dinheiro", "Cartão Crédito", "Cartão Débito", "Boleto"];
const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PedidoCreateModal({ isOpen, onClose, refreshList }) {
  const [passo, setPasso] = useState(1);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [cliente, setCliente] = useState(null);
  const [itens, setItens] = useState([]);
  const [pagamento, setPagamento] = useState("");
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [clientesLista, setClientesLista] = useState([]);
  const [produtosLista, setProdutosLista] = useState([]);

  const carregarListas = useEffectEvent(async () => {
    try {
      const [resClientes, resProdutos] = await Promise.all([getTodosClientes(), getProdutos()]);
      const dataClientes = resClientes?.data ?? resClientes;
      const dataProdutos = resProdutos?.data ?? resProdutos;
      setClientesLista(Array.isArray(dataClientes) ? dataClientes : []);
      setProdutosLista(Array.isArray(dataProdutos) ? dataProdutos : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar listas de clientes e produtos");
    }
  });

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        void carregarListas();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const clientesFiltrados = useMemo(() =>
    clientesLista.filter((c) =>
      c.nomeRazaoSocial?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
      c.cpfCnpj?.toLowerCase().includes(buscaCliente.toLowerCase())
    ), [clientesLista, buscaCliente]);

  const produtosFiltrados = useMemo(() =>
    produtosLista.filter((p) =>
      p.descricao?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      p.marca?.toLowerCase().includes(buscaProduto.toLowerCase())
    ), [produtosLista, buscaProduto]);

  const totalPedido = useMemo(() =>
    itens.reduce((acc, item) => acc + item.quantidade * item.valorComDesconto, 0),
    [itens]);

  const totalOriginal = useMemo(() =>
    itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0),
    [itens]);

  const totalDesconto = totalOriginal - totalPedido;

  function adicionarProduto(produto) {
    if (produto.qtdEstoque <= 0) return toast.error("Produto sem estoque");
    const existe = itens.find((item) => item.produtoId === produto.id);
    if (existe) {
      if (existe.quantidade >= existe.estoque) return toast.error("Quantidade máxima em estoque atingida");
      setItens((prev) => prev.map((item) =>
        item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
      return;
    }
    const preco = Number(produto.precoUnitario);
    setItens((prev) => [...prev, {
      produtoId: produto.id,
      descricao: produto.descricao,
      marca: produto.marca,
      estoque: produto.qtdEstoque,
      quantidade: 1,
      valorUnitario: preco,
      valorComDesconto: preco,   // valor editável no passo 3
      percentualDesconto: 0,     // percentual calculado
    }]);
  }

  function alterarQuantidade(produtoId, valor) {
    if (valor <= 0) return setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
    setItens((prev) => prev.map((item) =>
      (item.produtoId === produtoId && valor <= item.estoque)
        ? { ...item, quantidade: valor }
        : item
    ));
  }

  // Desconto por percentual → recalcula valorComDesconto
  function alterarPercentualDesconto(produtoId, percentual) {
    const pct = Math.min(100, Math.max(0, Number(percentual) || 0));
    setItens((prev) => prev.map((item) => {
      if (item.produtoId !== produtoId) return item;
      const novoValor = item.valorUnitario * (1 - pct / 100);
      return { ...item, percentualDesconto: pct, valorComDesconto: Number(novoValor.toFixed(2)) };
    }));
  }

  // Desconto por valor direto → recalcula percentual
  function alterarValorComDesconto(produtoId, valor) {
    setItens((prev) => prev.map((item) => {
      if (item.produtoId !== produtoId) return item;
      const novoValor = Math.min(item.valorUnitario, Math.max(0, Number(valor) || 0));
      const pct = item.valorUnitario > 0
        ? Number((((item.valorUnitario - novoValor) / item.valorUnitario) * 100).toFixed(2))
        : 0;
      return { ...item, valorComDesconto: novoValor, percentualDesconto: pct };
    }));
  }

  function avancar() {
    if (passo === 1 && !cliente) return toast.error("Selecione um cliente");
    if (passo === 2 && itens.length === 0) return toast.error("Adicione pelo menos 1 produto");
    if (passo < 4) setPasso((prev) => prev + 1);
  }

  function voltar() {
    if (passo === 1) return onClose();
    setPasso((prev) => prev - 1);
  }

  async function confirmarPedido() {
    if (!pagamento) return toast.error("Selecione a forma de pagamento");
    try {
      setLoadingSalvar(true);
      const pedido = await createPedido({
        numPedido: Date.now().toString(),
        formaPagamento: pagamento,
        clienteId: cliente.id,
        valorTotal: totalPedido,
      });
      for (let i = 0; i < itens.length; i++) {
        await createItemPedido({
          numItem: i + 1,
          quantidade: itens[i].quantidade,
          pedidoId: pedido.id,
          produtoId: itens[i].produtoId,
          valorUnitario: itens[i].valorComDesconto, // envia o valor com desconto
          justificativa: pagamento === "Distribuição" ? "Distribuição de produto" : "Venda de produto",
        });
      }
      toast.success("Pedido criado com sucesso!");
      refreshList();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Erro ao criar pedido");
    } finally {
      setLoadingSalvar(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={MODAL_CLASSES}>
        <div className="mb-8 flex items-center justify-between">
          <AlertDialogTitle className="text-3xl font-bold text-foreground">Novo Pedido</AlertDialogTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">X</button>
        </div>

        {/* Indicador de Passos */}
        <div className="mb-10 flex w-full items-center justify-center">
          <div className="flex w-full max-w-3xl items-center justify-between">
            {["Cliente", "Produtos", "Descontos", "Confirmar"].map((label, index) => {
              const n = index + 1;
              const active = passo === n;
              const done = passo > n;
              return (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all ${done ? "bg-green-500 text-foreground" : active ? "bg-orange-500 text-foreground shadow-lg shadow-orange-500/30" : "bg-card text-muted-foreground border border-border"}`}>
                      {done ? "✓" : n}
                    </div>
                    <span className={`text-sm transition-all ${active ? "font-semibold text-orange-400" : "text-muted-foreground"}`}>{label}</span>
                  </div>
                  {index < 3 && <div className={`mx-4 h-[2px] flex-1 rounded-full ${done ? "bg-green-500" : "bg-card"}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* PASSO 1 — Cliente */}
        {passo === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Buscar cliente</label>
              <input type="text" placeholder="Nome ou CPF/CNPJ..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)}
                className="w-full rounded-xl border text-foreground border-border bg-card px-4 py-4 text-sm outline-none focus:border-orange-500" />
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs uppercase tracking-wider text-muted-foreground">Cliente</th>
                      <th className="px-4 py-4 text-left text-xs uppercase tracking-wider text-muted-foreground">CPF/CNPJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id} onClick={() => setCliente(c)}
                        className={`cursor-pointer border-t border-border transition-all text-foreground ${cliente?.id === c.id ? "bg-orange-500/10" : ""}`}>
                        <td className="px-4 py-4">{c.nomeRazaoSocial}</td>
                        <td className="px-4 py-4 text-muted-foreground">{c.cpfCnpj}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2 — Produtos */}
        {passo === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Buscar Produto</label>
              <input type="text" placeholder="Nome do produto..." value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)}
                className="mb-4 w-full rounded-xl border border-border text-foreground bg-card px-4 py-4 text-sm outline-none focus:border-orange-500" />
              <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border">
                {produtosFiltrados.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between text-foreground border-b border-border p-4">
                    <div>
                      <div className="font-medium">{produto.descricao}</div>
                      <div className="text-sm text-muted-foreground">Estoque: {produto.qtdEstoque}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-orange-500">{moeda(produto.precoUnitario)}</div>
                      <button disabled={produto.qtdEstoque <= 0} onClick={() => adicionarProduto(produto)}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-foreground text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 text-lg font-semibold text-foreground">Itens do Pedido</div>
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {itens.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    Nenhum produto adicionado
                  </div>
                )}
                {itens.map((item) => (
                  <div key={item.produtoId} className="rounded-xl text-foreground border border-border bg-card p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{item.descricao}</div>
                        <div className="text-sm text-muted-foreground">Estoque: {item.estoque}</div>
                      </div>
                      <button onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== item.produtoId))}
                        className="rounded-lg border border-red-500/40 px-3 py-1 text-red-500">
                        Remover
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)} className="h-8 w-8 rounded-lg border border-border">-</button>
                        <span className="w-8 text-center font-bold">{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)} className="h-8 w-8 rounded-lg border border-border">+</button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{moeda(item.valorUnitario)}</div>
                        <div className="font-bold text-orange-500">{moeda(item.quantidade * item.valorUnitario)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3 — Descontos */}
        {passo === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ajuste o preço de cada item para este pedido. O valor original do produto <span className="font-semibold text-foreground">não será alterado</span>.
              </p>
              {totalDesconto > 0 && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-500">
                  Economia total: {moeda(totalDesconto)}
                </div>
              )}
            </div>

            {itens.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Nenhum produto adicionado
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item) => (
                  <div key={item.produtoId} className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{item.descricao}</div>
                        {item.marca && <div className="text-xs text-muted-foreground">{item.marca}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Qtd: {item.quantidade}</div>
                        <div className="text-xs text-muted-foreground">Preço original: {moeda(item.valorUnitario)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      {/* % desconto */}
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                          Desconto (%)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max="100" step="0.5"
                            value={item.percentualDesconto}
                            onChange={(e) => alterarPercentualDesconto(item.produtoId, e.target.value)}
                            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-orange-500"
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      </div>

                      {/* Valor com desconto */}
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                          Valor unitário (R$)
                        </label>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.valorComDesconto}
                          onChange={(e) => alterarValorComDesconto(item.produtoId, e.target.value)}
                          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <div className="text-xs text-muted-foreground mb-1">Subtotal do item</div>
                        <div className="font-bold text-orange-500 text-lg">
                          {moeda(item.quantidade * item.valorComDesconto)}
                        </div>
                        {item.percentualDesconto > 0 && (
                          <div className="text-xs text-muted-foreground line-through">
                            {moeda(item.quantidade * item.valorUnitario)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totalizador */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-8">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Subtotal original</div>
                  <div className="font-semibold text-foreground">{moeda(totalOriginal)}</div>
                </div>
                {totalDesconto > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Descontos</div>
                    <div className="font-semibold text-green-500">- {moeda(totalDesconto)}</div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Total com descontos</div>
                <div className="text-2xl font-bold text-orange-500">{moeda(totalPedido)}</div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4 — Confirmar */}
        {passo === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 text-xl font-bold text-foreground">Resumo do Pedido</div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Cliente</div>
                <div className="font-semibold text-foreground">{cliente?.nomeRazaoSocial}</div>
              </div>
              <div className="space-y-3">
                {itens.map((item) => (
                  <div key={item.produtoId} className="flex justify-between border-b border-border text-foreground pb-3">
                    <div>
                      <div>{item.descricao}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantidade} x {moeda(item.valorComDesconto)}
                        {item.percentualDesconto > 0 && (
                          <span className="ml-2 text-green-500">(-{item.percentualDesconto}%)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-500">{moeda(item.quantidade * item.valorComDesconto)}</div>
                      {item.percentualDesconto > 0 && (
                        <div className="text-xs text-muted-foreground line-through">{moeda(item.quantidade * item.valorUnitario)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalDesconto > 0 && (
                <div className="mt-4 flex justify-between text-sm text-green-500">
                  <span>Descontos aplicados</span>
                  <span>- {moeda(totalDesconto)}</span>
                </div>
              )}
              <div className="mt-6 flex justify-between border-t border-border pt-5 text-xl text-foreground font-bold">
                <span>Total</span>
                <span className="text-orange-500">{moeda(totalPedido)}</span>
              </div>
            </div>

            <div>
              <div className="mb-4 text-xl font-bold text-foreground">Forma de Pagamento</div>
              <div className="grid grid-cols-2 gap-4">
                {FORMAS_PAGAMENTO.map((op) => (
                  <button key={op} onClick={() => setPagamento(op)}
                    className={`rounded-xl border p-5 text-sm font-semibold transition-all ${pagamento === op ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-border bg-card text-muted-foreground hover:border-orange-500"}`}>
                    {op}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button onClick={voltar}
            className="rounded-lg border border-border px-5 py-3 text-sm text-muted-foreground transition-all hover:border-orange-500 hover:text-orange-500 cursor-pointer font-semibold">
            {passo === 1 ? "Cancelar" : "Voltar"}
          </button>
          {passo < 4 ? (
            <button onClick={avancar} className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 cursor-pointer">
              Próximo
            </button>
          ) : (
            <button onClick={confirmarPedido} disabled={loadingSalvar}
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer">
              {loadingSalvar ? "Salvando..." : "Confirmar Pedido"}
            </button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
