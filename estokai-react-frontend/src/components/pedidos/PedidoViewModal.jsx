import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FilePenLine, FileDown } from 'lucide-react';
import { toast } from "sonner";
import { gerarPedidoPdf } from "@/services/Gerarpedidopdf";

const MODAL_CLASSES = "bg-card border border-border !w-[96vw] !max-w-[96vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[84vw] xl:!max-w-[84vw] 2xl:!w-[78vw] 2xl:!max-w-[78vw] h-[92vh] overflow-y-auto p-8";

const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function InfoBox({ label, value }) {
  return (
    <div className="bg-valores rounded-lg px-4 py-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <p className="text-foreground mt-1 break-words text-xl font-medium">
        {value || <span className="text-muted-foreground italic font-medium">Não informado</span>}
      </p>
    </div>
  );
}

export function PedidoViewModal({ isOpen, onClose, pedido, onEdit }) {
  if (!pedido) return null;

  const handleEditClick = () => {
    onClose();
    if (onEdit) onEdit();
  };

  const handleGerarPdf = () => {
    try {
      gerarPedidoPdf(pedido);
      toast.success(`PDF do PED-${pedido.numPedido} gerado com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={MODAL_CLASSES}>
        <AlertDialogHeader className="w-full">
          <div className="flex w-full items-center justify-between gap-4 border-b border-border pb-4">
  {/* Lado esquerdo */}
  <div className="flex items-center gap-4 min-w-0">
    <div className="min-w-0">
      <AlertDialogTitle className="text-foreground text-xl font-black truncate">
        Pedido #{pedido.numPedido}
      </AlertDialogTitle>
      <p className="text-muted-foreground text-sm mt-1 truncate">
        {pedido.cliente?.nomeRazaoSocial}
      </p>
    </div>
    <div className="shrink-0 bg-orange-500/20 px-3 py-1.5 rounded-lg text-orange-500 border border-amber-700 text-sm font-semibold">
      {pedido.status}
    </div>
  </div>
  {/* Lado direito */}
  <button
    onClick={handleGerarPdf}
    className="shrink-0 h-11 px-6 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 font-semibold text-orange-500 flex items-center gap-2 transition-all"
  >
    <FileDown size={18} />
    Baixar PDF
  </button>
</div>
</AlertDialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
          <div className="flex flex-col gap-3">
            <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Pedido</p>
            <InfoBox label="Número" value={pedido.numPedido} />
            <InfoBox label="Pagamento" value={pedido.formaPagamento} />
            <InfoBox label="Status" value={pedido.status} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Cliente</p>
            <InfoBox label="Nome" value={pedido.cliente?.nomeRazaoSocial} />
            <InfoBox label="CPF/CNPJ" value={pedido.cliente?.cpfCnpj} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Financeiro</p>
            <InfoBox label="Total" value={moeda(pedido.valorTotal)} />
            <InfoBox label="Data" value={new Date(pedido.createdAt).toLocaleDateString("pt-BR")} />
          </div>
        </div>

        <div className="mt-2">
          <p className="mb-4 text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Produtos</p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {pedido.itens?.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{item?.produto?.descricao}</div>
                    <div className="text-sm text-muted-foreground mt-1">Marca: {item?.produto?.marca}</div>
                    <div className="text-sm text-muted-foreground">Quantidade: {item.quantidade}</div>
                    <div className="text-sm text-muted-foreground">Valor Unitário: {moeda(item.valorUnitario)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase">Total</div>
                    <div className="text-xl font-bold text-orange-500">{moeda(item.valorTotal)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="pt-4 mt-4 border-t border-border bg-card flex sm:justify-end items-center gap-3">
          <AlertDialogCancel
            onClick={onClose}
            className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0"
          >
            Fechar
          </AlertDialogCancel>
          {pedido.status === "Pendente" && (
            <button
              onClick={handleEditClick}
              className="h-11 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold text-white cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all outline-none"
            >
              <FilePenLine size={18} />
              Editar Pedido
            </button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}