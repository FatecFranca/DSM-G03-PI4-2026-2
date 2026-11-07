import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { toast } from "sonner";
import { createProduto, updateProduto, addFornecedorProduto, removeFornecedorProduto } from "@/services/produtosService";
import Image from "next/image";

const MODAL_CLASSES = "bg-card border-border !w-[98vw] !max-w-[98vw] md:!w-[92vw] md:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw] xl:!w-[82vw] xl:!max-w-[82vw] 2xl:!w-[75vw] 2xl:!max-w-[75vw] max-h-[92vh] overflow-y-auto p-4 md:p-8";

const estadoInicial = {
    descricao: "", marca: "", precoCusto: "", precoUnitario: "", peso: "", balancaId: "", qtdMinima: "",codProduto:"",
    imagem: null, fornecedorId: "", fornecedoresSelecionados: []
};

function getInitialFormData(produtoAtual) {
    if (!produtoAtual) {
        return { ...estadoInicial };
    }

    return {
        descricao: produtoAtual.descricao || "",
        marca: produtoAtual.marca || "",
        precoCusto: produtoAtual.precoCusto?.toString() || "",
        precoUnitario: produtoAtual.precoUnitario?.toString() || "",
        peso: produtoAtual.peso?.toString() || "",
        balancaId: produtoAtual.balancaId || "",
        codProduto: produtoAtual.codProduto?.toString() || "",
        qtdMinima: produtoAtual.qtdMinima?.toString() || "",
        imagem: null,
        fornecedorId: "",
        fornecedoresSelecionados: produtoAtual.fornecedores || []
    };
}

function FormField({ label, placeholder, value, onChange, colSpan, type, isRequired, step, min }) {
    return (
        <div className={colSpan ? "lg:col-span-" + colSpan : ""}>
            <label className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">
                {label} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <Input
                placeholder={placeholder}
                type={type ?? "text"}
                step={step}
                min={min}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="bg-card border-border text-foreground"
            />
        </div>
    );
}

export function ProdutoFormModal({ isOpen, onClose, produtoAtual, fornecedores, refreshList }) {
    const [formData, setFormData] = useState(() => getInitialFormData(produtoAtual));
    const isEditMode = !!produtoAtual;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }));

    const handleAddFornecedor = () => {
        if (!formData.fornecedorId) return;
        const fornecedorExiste = formData.fornecedoresSelecionados.some(v => v.fornecedor?.id === formData.fornecedorId);
        if (fornecedorExiste) return;

        const fornecedorEncontrado = fornecedores.find(f => f.id === formData.fornecedorId);
        if (fornecedorEncontrado) {
            setFormData(prev => ({
                ...prev,
                fornecedoresSelecionados: [...prev.fornecedoresSelecionados, { fornecedor: fornecedorEncontrado }],
                fornecedorId: ""
            }));
        }
    };

    const handleRemoveFornecedor = (index) => {
        setFormData(prev => ({
            ...prev,
            fornecedoresSelecionados: prev.fornecedoresSelecionados.filter((_, i) => i !== index)
        }));
    };

    const handleSalvar = async () => {
        if (!formData.descricao.trim()) {
            return toast.warning("O Nome do Produto é obrigatório.");
        }
        if (!formData.marca.trim()) {
            return toast.warning("A Marca do Produto é obrigatória.");
        }
        if (!formData.precoCusto) {
            return toast.warning("O Preço de Custo é obrigatório.");
        }
        if (!formData.precoUnitario) {
            return toast.warning("O Preço de Venda é obrigatório.");
        }
        if (!formData.peso || Number(formData.peso.replace(",", ".")) <= 0) {
            return toast.warning("Informe um peso válido em kg.");
        }
        if (!formData.qtdMinima) {
            return toast.warning("A Quantidade Mínima é obrigatória.");
        }

        try {
            setIsSubmitting(true);
            const data = new FormData();
            if (formData.imagem) data.append("imagem", formData.imagem);
            data.append("descricao", formData.descricao);
            data.append("marca", formData.marca);
            data.append("precoCusto", formData.precoCusto.replace(",", "."));
            data.append("precoUnitario", formData.precoUnitario.replace(",", "."));
            data.append("peso", formData.peso.replace(",", "."));
            data.append("balancaId", formData.balancaId);
            data.append("qtdMinima", formData.qtdMinima);
            data.append("codProduto",formData.codProduto);

            let produtoId = produtoAtual?.id;

            if (isEditMode) {
                await updateProduto(produtoId, data);
                if (produtoAtual?.fornecedores?.length > 0) {
                    for (const vinculo of produtoAtual.fornecedores) {
                        await removeFornecedorProduto(produtoId, vinculo.fornecedor.id);
                    }
                }
            } else {
                const produtoCriado = await createProduto(data);
                produtoId = produtoCriado.id;
            }

            for (const vinculo of formData.fornecedoresSelecionados) {
                await addFornecedorProduto(produtoId, vinculo.fornecedor.id);
            }

            toast.success(`Produto ${isEditMode ? "editado" : "criado"} com sucesso!`);
            refreshList();
            onClose();
        } catch (error) {
            toast.error(`Erro ao ${isEditMode ? "editar" : "criar"} produto`);
            console.error(error);
        }finally{
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className={MODAL_CLASSES}>
                <AlertDialogHeader>
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
                        <div className="bg-card p-3 rounded-xl aspect-[4/3] flex items-center justify-center">
                            {produtoAtual?.imagemUrl ? (
                                <Image src={produtoAtual.imagemUrl} alt="Produto" width={80} height={80} className="h-20 md:h-30 w-auto object-cover" />
                            ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                            <AlertDialogTitle className="text-foreground text-xl font-black truncate">
                                {isEditMode ? "Editar Produto" : "Novo Produto"}
                            </AlertDialogTitle>
                            {isEditMode && <p className="text-muted-foreground text-sm mt-0.5 truncate">{produtoAtual?.descricao}</p>}
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
                    {/* Identificação */}
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Identificação</p>
                        <div className="flex flex-col gap-2">
                            <label className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">Imagem do Produto</label>
                            <input
                                type="file" accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleChange("imagem", file);
                                }}
                                className="bg-card -mt-2 border border-border text-foreground rounded-md file:bg-orange-500 file:border-0 file:text-foreground file:px-3 file:py-1 file:rounded-md"
                            />
                        </div>
                        <FormField label="Nome do Produto" placeholder="Nome" value={formData.descricao} onChange={(v) => handleChange("descricao", v)} isRequired={true} />
                        <FormField label="Marca do Produto" placeholder="Marca" value={formData.marca} onChange={(v) => handleChange("marca", v)} isRequired={true} />
                        <FormField label="Codigo do produto" placeholder="Codigo" value={formData.codProduto} onChange={(v) => handleChange("codProduto", v)} />
                    </div>

                    {/* Preços */}
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Preços e Estoque</p>
                        <FormField label="Preço de custo" placeholder="0" value={formData.precoCusto} onChange={(v) => handleChange("precoCusto", v)} isRequired={true} />
                        <FormField label="Preço de Venda" placeholder="0" value={formData.precoUnitario} onChange={(v) => handleChange("precoUnitario", v)} isRequired={true} />
                        <FormField label="Peso do produto (kg)" placeholder="Ex.: 0,500" type="number" min="0.001" step="0.001" value={formData.peso} onChange={(v) => handleChange("peso", v)} isRequired={true} />
                        <FormField label="Balança vinculada" placeholder="ID da balança (ex.: balanca-01)" value={formData.balancaId} onChange={(v) => handleChange("balancaId", v)} />
                        <FormField label="Quantidade Minima" placeholder="0" type="number" value={formData.qtdMinima} onChange={(v) => handleChange("qtdMinima", v)} isRequired={true} />
                    </div>

                    {/* Fornecedores */}
                    <div className="flex flex-col gap-4">
                        <p className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">Fornecedores Vinculados</p>

                        {/* Wrapper e Label adicionados para manter o alinhamento */}
                        <div>
                            <label className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">
                                Adicionar Fornecedor
                            </label>
                            <div className="flex gap-2">
                                <select value={formData.fornecedorId} onChange={(e) => handleChange("fornecedorId", e.target.value)} className="flex-1 bg-card border border-border text-foreground rounded-md h-10 px-3">
                                    <option value="">Selecione um fornecedor</option>
                                    {(fornecedores || []).map((f) => (
                                        <option key={f.id} value={f.id}>{f.nomeFantasia}</option>
                                    ))}
                                </select>
                                <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={handleAddFornecedor}>+</Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {formData.fornecedoresSelecionados.length === 0 && <p className="text-muted-foreground text-sm italic">Nenhum fornecedor vinculado</p>}
                            {formData.fornecedoresSelecionados.map((vinculo, index) => (
                                <div key={index} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-foreground text-sm">{vinculo.fornecedor.nomeFantasia}</span>
                                        <span className="text-muted-foreground text-xs">{vinculo.fornecedor.cnpj}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveFornecedor(index)} className="text-red-400 hover:text-red-500 cursor-pointer">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="pt-4 mt-4 border-t border-border bg-card flex sm:justify-end items-center gap-3">
                    <AlertDialogCancel
                        onClick={onClose}
                        className="!mt-0 h-11 px-6 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer transition-all flex items-center justify-center outline-none focus:ring-0"
                    >
                        Cancelar
                    </AlertDialogCancel>
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
                            : (isEditMode ? "Salvar Alterações" : "Criar Produto")
                        }
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
