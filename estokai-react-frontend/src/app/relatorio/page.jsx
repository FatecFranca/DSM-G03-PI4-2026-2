"use client";

import { useState, useEffect, useEffectEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRelatorioPedidosDia } from "@/services/pedidosService";
import { gerarRelatorioPdf } from "@/services/Gerarrelatoriopdf";
import { toast } from "sonner";
import { Package, FileDown, CalendarDays, TrendingUp, ShoppingBag, Settings2 } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { PageHeader } from "@/components/PageHeader";

const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getTodayPeriod() {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const dia = String(dataAtual.getDate()).padStart(2, "0");
    const data = `${ano}-${mes}-${dia}`;
    return { dataInicio: data, dataFim: data };
}

export default function RelatorioPage() {
    const mounted = useMounted();
    const [dataInicio, setDataInicio] = useState(() => getTodayPeriod().dataInicio);
    const [dataFim, setDataFim] = useState(() => getTodayPeriod().dataFim);
    const [produtos, setProdutos] = useState([]);
    const [resumo, setResumo] = useState({
        quantidadePedidos: 0, totalBruto: 0, totalCusto: 0, totalLucro: 0,
        formasPagamento: { "Distribuição": 0, Dinheiro: 0, Pix: 0, "Cartão Crédito": 0, "Cartão Débito": 0, Boleto: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        mostrarCustoELucro: true,
        mostrarResumoPagamentos: true,
        mostrarCabecalhoEmpresa: true
    });

    const toggleConfig = (chave) => setConfig(prev => ({ ...prev, [chave]: !prev[chave] }));

    const buscarRelatorio = useEffectEvent(async () => {
        if (!dataInicio || !dataFim) return;
        if (new Date(dataInicio) > new Date(dataFim))
            return toast.error("A data inicial não pode ser maior que a final.");
        try {
            setLoading(true);
            const resp = await getRelatorioPedidosDia(dataInicio, dataFim);
            setProdutos(resp.produtos || []);
            setResumo(resp.resumo || {
                quantidadePedidos: 0, totalBruto: 0, totalCusto: 0, totalLucro: 0,
                formasPagamento: { "Distribuição": 0, Dinheiro: 0, Pix: 0, "Cartão Crédito": 0, "Cartão Débito": 0, Boleto: 0 }
            });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar dados do relatório");
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (mounted && dataInicio && dataFim) {
                void buscarRelatorio();
            }
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [dataInicio, dataFim, mounted]);

    const handleGerarPdf = () => {
        try {
            gerarRelatorioPdf(produtos, resumo, dataInicio, dataFim, config);
            toast.success("PDF do fechamento gerado com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar PDF");
        }
    };

    if (!mounted) return null;

    const colSpan = config.mostrarCustoELucro ? 6 : 5;

    return (
        <div className="flex flex-col w-full pb-10 text-muted-foreground">

            <PageHeader
                eyebrow="Resultados"
                title="Fechamento de Caixa"
                description="Consolide pedidos, pagamentos e rentabilidade por período com saída pronta para PDF."
                actions={(
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {[{ label: "De:", value: dataInicio, set: setDataInicio }, { label: "Até:", value: dataFim, set: setDataFim }].map(({ label, value, set }) => (
                            <div key={label} className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input type="date" value={value} onChange={(e) => set(e.target.value)}
                                        className="pl-10 bg-card border-border text-foreground font-semibold w-full" />
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleGerarPdf}
                            disabled={loading || produtos.length === 0}
                            className="h-11 px-6 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 font-semibold text-orange-500 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto mt-2 sm:mt-0"
                        >
                            <FileDown size={18} />
                            Baixar PDF
                        </button>
                    </div>
                )}
                className="mb-8"
            />

            <div className="px-4 md:px-8 lg:px-13 mb-8">
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-2 text-foreground font-bold">
                        <Settings2 className="w-5 h-5 text-orange-500" />
                        Opções do PDF:
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { chave: "mostrarCustoELucro", label: "Mostrar Custos e Lucro" },
                            { chave: "mostrarResumoPagamentos", label: "Mostrar Fechamento por Pagamento" },
                            { chave: "mostrarCabecalhoEmpresa", label: "Mostrar Cabeçalho Corporativo" },
                        ].map(({ chave, label }) => (
                            <label key={chave} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={config[chave]} onChange={() => toggleConfig(chave)}
                                    className="accent-orange-500 w-4 h-4" />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Preview na tela ── */}
            <div className="px-4 md:px-8 lg:px-13">

                {/* KPIs */}
                <div className={`grid gap-5 mb-8 ${config.mostrarCustoELucro ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"}`}>
                    <Card className="bg-card border-border p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor Total Bruto</p>
                            <p className="text-2xl font-black text-orange-500 mt-0.5">{moeda(resumo.totalBruto)}</p>
                        </div>
                    </Card>
                    {config.mostrarCustoELucro && (<>
                        <Card className="bg-card border-border p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-zinc-500/10 flex items-center justify-center shrink-0">
                                <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor Total Custo</p>
                                <p className="text-2xl font-black text-foreground mt-0.5">{moeda(resumo.totalCusto)}</p>
                            </div>
                        </Card>
                        <Card className="bg-card border-border p-5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lucro Líquido Total</p>
                                <p className="text-2xl font-black text-green-500 mt-0.5">{moeda(resumo.totalLucro)}</p>
                            </div>
                        </Card>
                    </>)}
                </div>

                {/* Tabela */}
                <div className="mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-l-4 border-orange-500 pl-3">
                        Produtos Vendidos no Período
                    </h3>
                </div>
                <div className="rounded-xl border border-border overflow-hidden mb-8 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-900 hover:bg-zinc-900">
                                <TableHead className="text-white font-bold pl-5">Produto / Marca</TableHead>
                                <TableHead className="text-white font-bold text-center">Qtd</TableHead>
                                {config.mostrarCustoELucro && <TableHead className="text-white font-bold text-right">Preço Custo</TableHead>}
                                <TableHead className="text-white font-bold text-right">Preço Venda</TableHead>
                                <TableHead className="text-white font-bold text-right">Total Venda</TableHead>
                                <TableHead className="text-white font-bold text-center pr-5">Pagamento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={colSpan} className="text-center py-10">Carregando relatório...</TableCell></TableRow>
                            ) : produtos.length === 0 ? (
                                <TableRow><TableCell colSpan={colSpan} className="text-center py-10">Nenhuma venda concluída no período.</TableCell></TableRow>
                            ) : produtos.map((p, i) => (
                                <TableRow key={p.id} className={`border-b border-border ${i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900/30" : ""}`}>
                                    <TableCell className="pl-5">
                                        <div className="font-semibold text-foreground text-sm">{p.descricao}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{p.marca}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-foreground">{p.quantidade}</TableCell>
                                    {config.mostrarCustoELucro && <TableCell className="text-right text-foreground">{moeda(p.precoCusto)}</TableCell>}
                                    <TableCell className="text-right text-foreground">{moeda(p.precoVenda)}</TableCell>
                                    <TableCell className="text-right font-bold text-orange-500">{moeda(p.totalVenda)}</TableCell>
                                    <TableCell className="text-center pr-5">
                                        <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            {p.formaPagamento}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
