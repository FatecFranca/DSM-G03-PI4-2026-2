import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, FilePenLine } from 'lucide-react'; // <-- Importado o ícone de edição

const MODAL_CLASSES = "bg-card border-border !w-[98vw] !max-w-[98vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[82vw] xl:!max-w-[82vw] 2xl:!w-[75vw] 2xl:!max-w-[75vw] max-h-[92vh] overflow-y-auto p-4 md:p-8";

function InfoBox({ label, value }) {
    return (
        <div className="bg-valores rounded-lg px-4 py-3">
            <span className="text-muted-foreground text-ss uppercase tracking-wider">{label}</span>
            <p className="text-foreground mt-1 break-words text-base text-xl font-medium">
                {value || <span className="text-muted-foreground italic text-xl font-medium ">Não informado</span>}
            </p>
        </div>
    );
}

export function FornecedorViewModal({ isOpen, onClose, fornecedor, onEdit }) {
    if (!fornecedor) return null;

    const handleEditClick = () => {
        onClose();
        if (onEdit) onEdit();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className={MODAL_CLASSES}>
                <AlertDialogHeader>
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
                        <div className="bg-orange-500/20 p-3 rounded-xl">
                            <Building2 className="text-orange-500" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <AlertDialogTitle className="text-foreground text-xl font-black truncate">{fornecedor.nomeFantasia}</AlertDialogTitle>
                            <p className="text-muted-foreground text-sm mt-0.5 truncate">{fornecedor.razaoSocial}</p>
                        </div>
                        <div className="shrink-0 bg-orange-500/20 px-3 py-1.5 rounded-lg text-orange-500 border border-amber-700 text-sm font-semibold">
                            {fornecedor._count?.produtos || 0} produtos
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Identificação</p>
                        <InfoBox label="CNPJ" value={fornecedor.cnpj} />
                        <InfoBox label="Categoria" value={fornecedor.categoria} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Contato</p>
                        <InfoBox label="E-mail" value={fornecedor.email} />
                        <InfoBox label="Telefone 1" value={fornecedor.telefone1} />
                        {fornecedor.telefone2 && <InfoBox label="Telefone 2" value={fornecedor.telefone2} />}
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Endereço</p>
                        <InfoBox label="Logradouro" value={fornecedor.logradouro} />
                        <InfoBox label="Número" value={fornecedor.numImovel} />
                        <InfoBox label="Complemento" value={fornecedor.complemento} />
                        <InfoBox label="Bairro" value={fornecedor.bairro} />
                        <InfoBox label="Município/UF" value={`${fornecedor.municipio || ''} - ${fornecedor.uf || ''}`} />
                        <InfoBox label="CEP" value={fornecedor.cep} />
                    </div>
                </div>

                {/* <-- Rodapé atualizado com os botões alinhados */}
                <AlertDialogFooter className="pt-4 mt-4 border-t border-border bg-card flex sm:justify-end items-center gap-3">
                    <AlertDialogCancel onClick={onClose} className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0">
                        Fechar
                    </AlertDialogCancel>
                    <button 
                        onClick={handleEditClick} 
                        className="!mt-0 h-11 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold text-white cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all outline-none focus:ring-0"
                    >
                        <FilePenLine size={18} />
                        Editar Fornecedor
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}