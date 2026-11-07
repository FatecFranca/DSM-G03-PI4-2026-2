import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCliente } from "@/services/clienteService";
import { useState } from "react";

export function ClienteDeleteModal({ isOpen, onClose, cliente, refreshList }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!cliente) return null;

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            await deleteCliente(cliente.id);
            toast.success("Cliente deletado com sucesso!");
            refreshList();
            onClose();
        } catch (error) {
            toast.error("Erro ao deletar cliente");
            console.error(error);
        }finally{
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="bg-card border-border w-[95%] max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        Essa ação irá deletar o cliente <strong className="text-foreground">{cliente.nomeRazaoSocial}</strong> permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="bg-card">
                    <AlertDialogCancel onClick={onClose} className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0">Cancelar</AlertDialogCancel>
                    <button
                        disabled={isSubmitting}
                        onClick={handleConfirm}
                        className={`!mt-0 h-11 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-all outline-none focus:ring-0 ${isSubmitting
                                ? "bg-red-900 cursor-not-allowed opacity-70"
                                : "bg-red-500 hover:bg-red-600 cursor-pointer shadow-md"
                            }`}
                    >
                        {isSubmitting ? "Deletando..." : "Confirmar Exclusão"}
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
