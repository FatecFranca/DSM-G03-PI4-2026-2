import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { FilePenLine } from 'lucide-react'; // <-- Importado o ícone de edição

const MODAL_CLASSES = "bg-card border-border !w-[98vw] !max-w-[98vw] md:!w-[90vw] md:!max-w-[90vw] lg:!w-[82vw] lg:!max-w-[82vw] max-h-[92vh] overflow-y-auto p-4 md:p-8";

function InfoBox({ label, value }) {
    return (
        <div className="bg-valores rounded-lg px-4 py-3">
            <span className="text-muted-foreground text-ss uppercase tracking-wider">{label}</span>
            <p className="text-foreground mt-1 break-words text-base text-xl font-medium">
                {value ?? <span className="text-muted-foreground italic text-xl font-medium ">Não informado</span>}
            </p>
        </div>
    );
}

export function ProdutoViewModal({ isOpen, onClose, produto, onEdit }) {
    if (!produto) return null;

    const isCritico = produto.qtdEstoque <= produto.qtdMinima;

    const handleEditClick = () => {
        onClose();
        if (onEdit) onEdit();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className={MODAL_CLASSES}>
                <AlertDialogHeader>
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 bg-card flex items-center justify-center">
                            {produto.imagemUrl && <Image src={produto.imagemUrl} alt={produto.descricao} width={64} height={64} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <AlertDialogTitle className="text-foreground text-xl font-black truncate">{produto.descricao}</AlertDialogTitle>
                            <p className="text-muted-foreground text-sm mt-0.5">{produto.marca}</p>
                        </div>
                        <div className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold border ${isCritico ? "bg-red-500/20 text-red-400 border-red-700" : "bg-green-500/20 text-green-400 border-green-700"}`}>
                            {isCritico ? "Crítico" : "Normal"}
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Identificação</p>
                        <InfoBox label="Descrição" value={produto.descricao} />
                        <InfoBox label="Marca" value={produto.marca} />
                        <InfoBox label="Codigo" value={produto.codProduto} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Preços e Estoque</p>
                        <InfoBox label="Preço Custo" value={`R$ ${produto.precoCusto}`} />
                        <InfoBox label="Preço Venda" value={`R$ ${produto.precoUnitario}`} />
                        <InfoBox label="Peso do produto" value={produto.peso != null ? `${Number(produto.peso).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg` : null} />
                        <InfoBox label="Balança vinculada" value={produto.balancaId} />
                        <InfoBox label="Qtd. em Estoque" value={produto.qtdEstoque} />
                        <InfoBox label="Qtd. Mínima" value={produto.qtdMinima} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Fornecedores vinculados</p>
                        {produto.fornecedores?.length === 0 && <p className="text-muted-foreground text-sm italic">Nenhum fornecedor vinculado.</p>}
                        {produto.fornecedores?.map((vinculo, index) => (
                            <div key={vinculo.fornecedor?.id || index} className="bg-card rounded-lg px-4 py-3 flex flex-col min-w-0">
                                <span className="text-foreground text-sm font-medium truncate">{vinculo.fornecedor?.nomeFantasia}</span>
                                <span className="text-muted-foreground text-xs truncate">{vinculo.fornecedor?.cnpj}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* <-- Rodapé atualizado com os botões alinhados e mesma altura */}
                <AlertDialogFooter className="pt-4 mt-4 border-t border-border bg-card flex sm:justify-end items-center gap-3">
                    <AlertDialogCancel onClick={onClose} className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0">
                        Fechar
                    </AlertDialogCancel>
                    <button 
                        onClick={handleEditClick} 
                        className="!mt-0 h-11 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold text-white cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all outline-none focus:ring-0"
                    >
                        <FilePenLine size={18} />
                        Editar Produto
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
