import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updatePedido } from "@/services/pedidosService";

const MODAL_CLASSES = "bg-card border border-border !w-[96vw] !max-w-[96vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[84vw] xl:!max-w-[84vw] 2xl:!w-[78vw] 2xl:!max-w-[78vw] h-[92vh] overflow-y-auto p-8 flex flex-col";
const FORMAS_PAGAMENTO = ["Distribuição", "Pix", "Dinheiro", "Cartão Crédito", "Cartão Débito", "Boleto"];
const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getInitialEditData(pedido) {
  return {
    status: pedido?.status ?? "",
    formaPagamento: pedido?.formaPagamento ?? "",
  };
}

export function PedidoEditModal({ isOpen, onClose, pedido, refreshList }) {
  const [editData, setEditData] = useState(() => getInitialEditData(pedido));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pedido) return null;

  const salvarEdicao = async () => {
    try {
      setIsSubmitting(true);
      await updatePedido(pedido.id, editData);
      toast.success("Pedido atualizado!");
      refreshList();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={MODAL_CLASSES}>

        {/* === CABEÇALHO === */}
        <AlertDialogHeader>
          <div className="flex w-full items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="flex-col text-left">
                <AlertDialogTitle className="text-foreground text-xl font-black truncate">Editar Pedido</AlertDialogTitle>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">Pedido #{pedido.numPedido}</p>
              </div>
              <div className="shrink-0 bg-orange-500/20 px-3 py-1.5 rounded-lg text-orange-500 border border-amber-700 text-sm font-semibold">
                {pedido.status}
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        {/* === CORPO (CONTEÚDO) === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 py-6 flex-1">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-5 text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Status do Pedido</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Pendente", "Concluído", "Cancelado"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setEditData({ ...editData, status })}
                    className={`rounded-xl border p-5 text-sm font-semibold transition-all ${editData.status === status
                      ? status === "Concluído" ? "border-green-500 bg-green-500/10 text-green-400"
                        : status === "Cancelado" ? "border-red-500 bg-red-500/10 text-red-400"
                          : "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-border bg-card text-muted-foreground hover:border-orange-500"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-5 text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Forma de Pagamento</p>
              <div className="grid grid-cols-2 gap-4">
                {FORMAS_PAGAMENTO.map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => setEditData({ ...editData, formaPagamento: opcao })}
                    className={`rounded-xl border p-5 text-sm font-semibold transition-all ${editData.formaPagamento === opcao
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-border bg-card text-muted-foreground hover:border-orange-500"
                      }`}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 h-fit">
            <p className="mb-5 text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Resumo</p>
            <div className="space-y-4">
              <div className="rounded-xl bg-card p-4">
                <span className="text-xs text-muted-foreground uppercase">Pedido</span>
                <p className="text-foreground font-semibold mt-1">#{pedido.numPedido}</p>
              </div>
              <div className="rounded-xl bg-card p-4">
                <span className="text-xs text-muted-foreground uppercase">Cliente</span>
                <p className="text-foreground font-semibold mt-1">{pedido.cliente?.nomeRazaoSocial}</p>
              </div>
              <div className="rounded-xl bg-card p-4">
                <span className="text-xs text-muted-foreground uppercase">Total</span>
                <p className="text-orange-500 text-xl font-bold mt-1">{moeda(pedido.valorTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* === RODAPÉ === (Botões colados na direita) */}
        <AlertDialogFooter className="border-t border-border pt-6 bg-card flex justify-end gap-3 mt-auto">
          <AlertDialogCancel onClick={onClose} className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0">
            Cancelar
          </AlertDialogCancel>
          <button
            disabled={isSubmitting}
            onClick={salvarEdicao}
            className={`!mt-0 h-11 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-all outline-none focus:ring-0 ${isSubmitting
                ? "bg-muted-foreground cursor-not-allowed opacity-70"
                : "bg-amber-500 hover:bg-amber-600 cursor-pointer shadow-md"
              }`}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}
