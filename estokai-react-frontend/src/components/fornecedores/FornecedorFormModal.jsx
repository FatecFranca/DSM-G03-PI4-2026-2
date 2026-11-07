import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Building2 } from 'lucide-react';
import { toast } from "sonner";
import { createFornecedor, updateFornecedor } from "@/services/fornecedoresService";

const MODAL_CLASSES = "bg-card border-border !w-[98vw] !max-w-[98vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[82vw] xl:!max-w-[82vw] 2xl:!w-[75vw] 2xl:!max-w-[75vw] max-h-[92vh] overflow-y-auto p-4 md:p-8";

const estadoInicial = {
    razaoSocial: "", nomeFantasia: "", cnpj: "", categoria: "", email: "",
    telefone1: "", telefone2: "", cep: "", logradouro: "", numImovel: "",
    complemento: "", bairro: "", municipio: "", uf: ""
};

function getInitialFormData(fornecedorAtual) {
    return fornecedorAtual ? { ...estadoInicial, ...fornecedorAtual } : { ...estadoInicial };
}

function FormField({ label, placeholder, value, onChange, colSpan, isRequired }) {
    return (
        <div className={colSpan ? "lg:col-span-" + colSpan : ""}>
            <label className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">
                {label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <Input
                placeholder={placeholder}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="bg-card border-border text-foreground"
            />
        </div>
    );
}

export function FornecedorFormModal({ isOpen, onClose, fornecedorAtual, refreshList }) {
    const [formData, setFormData] = useState(() => getInitialFormData(fornecedorAtual));
    const isEditMode = !!fornecedorAtual;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }));

    const handleSalvar = async () => {
        if (!formData.razaoSocial.trim()) {
            return toast.warning("A Razão Social é obrigatória.");
        }
        if (!formData.nomeFantasia.trim()) {
            return toast.warning("O Nome Fantasia é obrigatório.");
        }
        if (!formData.categoria.trim()) {
            return toast.warning("A Categoria é obrigatória.");
        }
        try {
            setIsSubmitting(true);
            if (isEditMode) {
                await updateFornecedor(fornecedorAtual.id, formData);
                toast.success("Fornecedor editado com sucesso!");
            } else {
                await createFornecedor(formData);
                toast.success("Fornecedor criado com sucesso!");
            }
            refreshList();
            onClose();
        } catch (error) {
            toast.error(`Erro ao ${isEditMode ? "editar" : "criar"} fornecedor`);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
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
                            <AlertDialogTitle className="text-foreground text-xl font-black truncate">
                                {isEditMode ? "Editar Fornecedor" : "Novo Fornecedor"}
                            </AlertDialogTitle>
                            {isEditMode && <p className="text-muted-foreground text-sm mt-0.5 truncate">{fornecedorAtual?.razaoSocial}</p>}
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Identificação</p>
                        <FormField label="Razão Social" placeholder="Razão Social" value={formData.razaoSocial} onChange={(v) => handleChange("razaoSocial", v)} isRequired={true} />
                        <FormField label="Nome Fantasia" placeholder="Nome Fantasia" value={formData.nomeFantasia} onChange={(v) => handleChange("nomeFantasia", v)} isRequired={true} />
                        <FormField label="CNPJ" placeholder="CNPJ" value={formData.cnpj} onChange={(v) => handleChange("cnpj", v)} />
                        <FormField label="Categoria" placeholder="Categoria" value={formData.categoria} onChange={(v) => handleChange("categoria", v)} isRequired={true} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Contato</p>
                        <FormField label="E-mail" placeholder="email@exemplo.com" value={formData.email} onChange={(v) => handleChange("email", v)} />
                        <FormField label="Telefone 1" placeholder="(00) 90000-0000" value={formData.telefone1} onChange={(v) => handleChange("telefone1", v)} />
                        <FormField label="Telefone 2" placeholder="(00) 90000-0000" value={formData.telefone2} onChange={(v) => handleChange("telefone2", v)} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Endereço</p>
                        <FormField label="CEP" placeholder="00000-000" value={formData.cep} onChange={(v) => handleChange("cep", v)} />
                        <FormField label="Logradouro" placeholder="Rua, Av..." value={formData.logradouro} onChange={(v) => handleChange("logradouro", v)} />
                        <FormField label="Número" placeholder="Nº" value={formData.numImovel} onChange={(v) => handleChange("numImovel", v)} />
                        <FormField label="Complemento" placeholder="Apto, Sala..." value={formData.complemento} onChange={(v) => handleChange("complemento", v)} />
                        <FormField label="Bairro" placeholder="Bairro" value={formData.bairro} onChange={(v) => handleChange("bairro", v)} />
                        <FormField label="Município" placeholder="Município" value={formData.municipio} onChange={(v) => handleChange("municipio", v)} />
                        <FormField label="UF" placeholder="UF" value={formData.uf} onChange={(v) => handleChange("uf", v)} />
                    </div>
                </div>

                <AlertDialogFooter className="pt-2 border-t border-border bg-card">
                    <AlertDialogCancel onClick={onClose} className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0">Cancelar</AlertDialogCancel>
                    <button
                        disabled={isSubmitting}
                        onClick={handleSalvar}
                        className={`!mt-0 h-11 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-all outline-none focus:ring-0 ${isSubmitting
                            ? "bg-muted-foreground cursor-not-allowed opacity-70"
                            : isEditMode
                                ? "bg-amber-500 hover:bg-amber-600 cursor-pointer shadow-md"
                                : "bg-green-500 hover:bg-green-600 cursor-pointer shadow-md"
                            }`}
                    >
                        {isSubmitting
                            ? "Salvando..."
                            : (isEditMode ? "Salvar Alterações" : "Criar Fornecedor")
                        }
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
