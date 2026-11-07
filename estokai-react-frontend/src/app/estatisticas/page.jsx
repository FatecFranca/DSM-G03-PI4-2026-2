"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  ChartColumnIncreasing,
  Gauge,
  Clock3,
  Settings,
  Thermometer,
  TriangleAlert,
  UsersRound,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { getBusinessHours, getLatestTelemetry, getTelemetryDevice, getTelemetryStatistics, updateBusinessHours, updateTelemetryDevice } from "@/services/telemetriaService";
import { subscribeToDataChanges, subscribeToTelemetryChanges } from "@/services/socket";

const PERIODOS = ["Hoje", "Semana", "Mes"];
const PERIODO_VISUALIZACAO = {
  Hoje: "Dia",
  Semana: "Semana",
  Mes: "Mes",
};

const ITEM_COLORS = [
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-green-400",
  "from-orange-500 to-amber-400",
  "from-fuchsia-500 to-pink-400",
  "from-violet-500 to-indigo-400",
];

function createEmptyStats() {
  const labels = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

  return {
    labels,
    pessoas: Array(labels.length).fill(0),
    compras: Array(labels.length).fill(0),
    pico: 0,
    topItens: [],
    resumo: {
      pessoasTotal: 0,
      comprasTotal: 0,
      itensVendidos: 0,
    },
    pesos: {
      totalKg: 0,
      mediaKg: 0,
      desvioPadraoKg: null,
      assimetria: null,
      balancasConfiguradas: 0,
      balancasComLeitura: 0,
    },
    previsoes: {
      compras: {
        disponivel: false,
        pontosTreino: 0,
        rQuadrado: null,
        correlacaoTempo: null,
        labels: [],
        valores: [],
      },
      topItens: [],
    },
    ventilador: { ligado: false, limite: 30, limiteDesligamento: 25, temperaturaAtual: null },
  };
}

function formatWeight(value) {
  return `${Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`;
}

function formatOptionalWeight(value) {
  return value === null || value === undefined ? "--" : formatWeight(value);
}

function formatChartLabel(label, visualizacao, dataReferencia) {
  const texto = String(label);

  if (visualizacao === "Dia" && !texto.includes(":")) return `${texto}h`;
  if (visualizacao !== "Mes") return texto;

  const [dia, mes] = texto.split("/");
  const diaNumerico = Number(dia);
  const mesNumerico = Number(mes);

  if (!Number.isInteger(diaNumerico) || diaNumerico < 1 || diaNumerico > 31) return texto;

  return `${String(diaNumerico).padStart(2, "0")}/${String(
    Number.isInteger(mesNumerico) && mesNumerico >= 1 && mesNumerico <= 12
      ? mesNumerico
      : dataReferencia.getMonth() + 1
  ).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time ?? "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function isOutsideBusinessHours(horarioInicio, horarioFim, date) {
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const current = timeToMinutes(now);
  const start = timeToMinutes(horarioInicio);
  const end = timeToMinutes(horarioFim);

  return start < end ? current < start || current >= end : current < start && current >= end;
}

function formatTelemetryValue(reading, fallback = "--") {
  if (!reading) return fallback;

  const value = Number(reading.value);
  const formattedValue = Number.isInteger(value)
    ? value.toLocaleString("pt-BR")
    : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const unit = reading.unit === "people" ? "pessoas" : reading.unit;

  return `${formattedValue} ${unit}`;
}

function telemetryToMap(readings) {
  return readings.reduce((acc, reading) => {
    acc[reading.sensorType] = reading;
    return acc;
  }, {});
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

function calcularY(value, min, range, height, padding) {
  return height - padding - ((value - min) / range) * (height - padding * 2);
}

function calcularPath(values, width, height, padding, min, max, startIndex = 0, totalPoints = values.length) {
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = padding + ((startIndex + index) * (width - padding * 2)) / Math.max(totalPoints - 1, 1);
      const y = calcularY(value, min, range, height, padding);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function calcularArea(values, width, height, padding, min, max, startIndex = 0, totalPoints = values.length) {
  const line = calcularPath(values, width, height, padding, min, max, startIndex, totalPoints);
  const firstX = padding + (startIndex * (width - padding * 2)) / Math.max(totalPoints - 1, 1);
  const lastX = padding + ((startIndex + values.length - 1) * (width - padding * 2)) / Math.max(totalPoints - 1, 1);
  return `${line} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
}

function calcularPassoEscala(min, max, total = 5) {
  const intervalo = Math.max(max - min, 1);
  const passoBruto = intervalo / Math.max(total - 1, 1);
  const potencia = 10 ** Math.floor(Math.log10(passoBruto));
  const fracao = passoBruto / potencia;

  if (fracao <= 1) return potencia;
  if (fracao <= 2) return 2 * potencia;
  if (fracao <= 5) return 5 * potencia;
  return 10 * potencia;
}

function criarEscalaLateral(values, total = 5) {
  const max = Math.max(...values);
  const passo = calcularPassoEscala(0, max, total);
  const multiplicadorMinimo = Math.max(Math.ceil(max / passo), total - 1);
  const maximoEscala = multiplicadorMinimo * passo;

  return Array.from({ length: total }, (_, index) => maximoEscala - index * passo);
}

export default function EstatisticasPage() {
  const [periodo, setPeriodo] = useState("Hoje");
  const [telemetria, setTelemetria] = useState({});
  const [estatisticas, setEstatisticas] = useState(() => createEmptyStats());
  const [horarioInicio, setHorarioInicio] = useState("08:00");
  const [horarioFim, setHorarioFim] = useState("18:00");
  const [temperaturaVentilador, setTemperaturaVentilador] = useState("30");
  const [deviceId, setDeviceId] = useState("");
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [salvandoHorario, setSalvandoHorario] = useState(false);
  const [salvandoDispositivo, setSalvandoDispositivo] = useState(false);
  const [agora, setAgora] = useState(() => new Date());
  const visualizacao = PERIODO_VISUALIZACAO[periodo];

  const hoje = useMemo(() => new Date(), []);
  const inicioPeriodo = useMemo(() => {
    if (periodo === "Hoje") return hoje;
    if (periodo === "Semana") return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }, [hoje, periodo]);

  const serieAtual = estatisticas;
  const previsaoCompras = serieAtual.previsoes?.compras ?? createEmptyStats().previsoes.compras;
  const previsaoDisponivel = previsaoCompras.disponivel && previsaoCompras.valores.length > 0;
  // A API cria buckets para todo o período, inclusive os futuros. Exibe os
  // dados reais até o período em andamento e mantém a previsão só a partir do próximo.
  const totalHistorico = Math.min(
    serieAtual.compras.length,
    visualizacao === "Dia" ? hoje.getHours() + 1 : visualizacao === "Semana" ? 7 : hoje.getDate(),
  );
  const comprasHistoricas = useMemo(
    () => serieAtual.compras.slice(0, totalHistorico),
    [serieAtual.compras, totalHistorico]
  );
  const labelsHistoricas = useMemo(
    () => serieAtual.labels.slice(0, totalHistorico),
    [serieAtual.labels, totalHistorico]
  );
  const valoresPrevisao = useMemo(
    () => previsaoDisponivel ? previsaoCompras.valores : [],
    [previsaoCompras.valores, previsaoDisponivel]
  );
  const labelsGrafico = useMemo(
    () => previsaoDisponivel ? [...labelsHistoricas, ...previsaoCompras.labels] : labelsHistoricas,
    [labelsHistoricas, previsaoCompras.labels, previsaoDisponivel]
  );
  const valoresGrafico = useMemo(
    () => [...comprasHistoricas, ...valoresPrevisao],
    [comprasHistoricas, valoresPrevisao]
  );
  const larguraChart = 840;
  const rotacionarRotulosDoEixo = visualizacao === "Mes";
  const alturaChart = rotacionarRotulosDoEixo ? 390 : 320;
  const padding = rotacionarRotulosDoEixo ? 80 : 44;
  const labelsEscala = useMemo(
    () => criarEscalaLateral(valoresGrafico, 5),
    [valoresGrafico]
  );
  const minEscala = labelsEscala[labelsEscala.length - 1] ?? 0;
  const maxEscala = labelsEscala[0] ?? 0;
  const rangeEscala = Math.max(maxEscala - minEscala, 1);

  const pathCompras = useMemo(
    () => calcularPath(comprasHistoricas, larguraChart, alturaChart, padding, minEscala, maxEscala, 0, labelsGrafico.length),
    [alturaChart, comprasHistoricas, labelsGrafico.length, minEscala, maxEscala, padding]
  );
  const areaCompras = useMemo(
    () => calcularArea(comprasHistoricas, larguraChart, alturaChart, padding, minEscala, maxEscala, 0, labelsGrafico.length),
    [alturaChart, comprasHistoricas, labelsGrafico.length, minEscala, maxEscala, padding]
  );
  const pathPrevisao = useMemo(() => {
    if (!previsaoDisponivel) return "";

    return calcularPath(
      [comprasHistoricas[comprasHistoricas.length - 1] ?? 0, ...valoresPrevisao],
      larguraChart,
      alturaChart,
      padding,
      minEscala,
      maxEscala,
      Math.max(comprasHistoricas.length - 1, 0),
      labelsGrafico.length,
    );
  }, [alturaChart, comprasHistoricas, labelsGrafico.length, maxEscala, minEscala, padding, previsaoDisponivel, valoresPrevisao]);
  const picoIndex = comprasHistoricas.reduce((melhorIndice, valor, indice) => (
    valor > comprasHistoricas[melhorIndice] ? indice : melhorIndice
  ), 0);
  const picoX = padding + (picoIndex * (larguraChart - padding * 2)) / Math.max(labelsGrafico.length - 1, 1);
  const picoYCompras = calcularY(comprasHistoricas[picoIndex] ?? 0, minEscala, rangeEscala, alturaChart, padding);
  const legendaPico = visualizacao === "Dia"
    ? `Horário de pico: ${labelsHistoricas[picoIndex]}:00`
    : visualizacao === "Semana"
      ? `Dia de pico: ${labelsHistoricas[picoIndex]}`
      : `Dia do mês de pico: ${labelsHistoricas[picoIndex]}`;
  const previsoesTopItensPorId = useMemo(
    () => new Map((serieAtual.previsoes?.topItens ?? []).map((item) => [item.id, item])),
    [serieAtual.previsoes?.topItens]
  );

  useEffect(() => {
    let ignore = false;

    async function carregarDados() {
      try {
        const [readings, stats, horario, dispositivo] = await Promise.all([
          getLatestTelemetry(),
          getTelemetryStatistics({ visualizacao }),
          getBusinessHours(),
          getTelemetryDevice(),
        ]);

        if (!ignore) {
          setTelemetria(telemetryToMap(readings));
          setEstatisticas(stats);
          setHorarioInicio(horario.horarioInicio);
          setHorarioFim(horario.horarioFim);
          setTemperaturaVentilador(String(horario.temperaturaVentilador ?? 30));
          setDeviceId(dispositivo?.deviceId ?? "");
          setDeviceIdInput(dispositivo?.deviceId ?? "");
        }
      } catch (error) {
        console.error("Erro ao carregar estatisticas IoT:", error);
      }
    }

    void carregarDados();

    const unsubscribeTelemetry = subscribeToTelemetryChanges((reading) => {
      // Além do isolamento aplicado pelo backend, valida o dispositivo no
      // cliente para que eventos de outra conexão nunca alterem esta tela.
      if (!deviceId || reading.deviceId !== deviceId) {
        return;
      }

      setTelemetria((current) => ({
        ...current,
        [reading.sensorType]: reading,
      }));

      if (reading.sensorType === "MOTION" || reading.sensorType === "WEIGHT" || reading.sensorType === "TEMPERATURE") {
        void carregarDados();
      }
    });

    const unsubscribeData = subscribeToDataChanges(["pedidos", "dashboard"], () => {
      void carregarDados();
    });

    return () => {
      ignore = true;
      unsubscribeTelemetry();
      unsubscribeData();
    };
  }, [deviceId, visualizacao]);

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const sensoresAtivos = Object.keys(telemetria).length;
  const pessoasNoAmbiente = Math.max(Math.round(Number(telemetria.MOTION?.value ?? 0)), 0);
  const pessoasDetectadas = pessoasNoAmbiente > 0;
  const textoPessoas = `${pessoasNoAmbiente} ${pessoasNoAmbiente === 1 ? "pessoa" : "pessoas"}`;
  const foraDoHorario = isOutsideBusinessHours(horarioInicio, horarioFim, agora);
  const pesos = estatisticas.pesos ?? createEmptyStats().pesos;
  const ventilador = estatisticas.ventilador ?? createEmptyStats().ventilador;

  async function salvarHorarioComercial() {
    try {
      setSalvandoHorario(true);
      const horario = await updateBusinessHours(horarioInicio, horarioFim, temperaturaVentilador);
      setHorarioInicio(horario.horarioInicio);
      setHorarioFim(horario.horarioFim);
      setTemperaturaVentilador(String(horario.temperaturaVentilador));
      setEstatisticas((current) => ({
        ...current,
        ventilador: {
          ...current.ventilador,
          ligado: horario.ventiladorLigado,
          limite: horario.temperaturaVentilador,
          limiteDesligamento: horario.limiteDesligamento,
        },
      }));
      toast.success("Horário comercial e limite do ventilador atualizados.");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Não foi possível atualizar o horário comercial.");
    } finally {
      setSalvandoHorario(false);
    }
  }

  async function salvarDispositivo() {
    try {
      setSalvandoDispositivo(true);
      const dispositivo = await updateTelemetryDevice(deviceIdInput);
      setDeviceId(dispositivo.deviceId);
      setDeviceIdInput(dispositivo.deviceId);
      toast.success("Dispositivo IoT vinculado à sua conta.");
      const readings = await getLatestTelemetry();
      setTelemetria(telemetryToMap(readings));
    } catch (error) {
      toast.error(error?.response?.data?.error || "Não foi possível vincular o dispositivo IoT.");
    } finally {
      setSalvandoDispositivo(false);
    }
  }

  return (
    <div className="min-h-screen w-full pb-10">
      <div className="px-4 pt-2 md:px-8 lg:px-13">
        <div className="flex flex-col gap-3 pb-6">
          <div className="text-orange-400 text-xs font-semibold uppercase tracking-[0.35em]">Resultados</div>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="display-font text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Estatísticas de Loja (IoT)
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Telemetria operacional, correlação com vendas e sinais em tempo real.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-[0_0_0_1px_rgba(249,115,22,0.04)]">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Período</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <span>{formatarData(inicioPeriodo)}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{formatarData(hoje)}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="stats-hero-card rounded-[26px] border border-border p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="stats-control-group flex rounded-full border border-border p-1">
                  {PERIODOS.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setPeriodo(item);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        periodo === item
                          ? "bg-card text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="inline-flex self-start items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 xl:self-auto">
                <Wifi className="h-4 w-4" />
                {sensoresAtivos} sensores ativos
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Settings className="h-4 w-4 text-orange-400" />
                <span>Horário comercial</span>
                <input aria-label="Início do horário comercial" type="time" value={horarioInicio} onChange={(event) => setHorarioInicio(event.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-foreground" />
                <span>às</span>
                <input aria-label="Fim do horário comercial" type="time" value={horarioFim} onChange={(event) => setHorarioFim(event.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-foreground" />
                <span className="border-l border-border pl-3">Ventilador a partir de</span>
                <input aria-label="Temperatura para ligar o ventilador" type="text" inputMode="numeric" maxLength={2} value={temperaturaVentilador} onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 2);
                  setTemperaturaVentilador(value);
                }} className="w-14 rounded-lg border border-border bg-card px-2 py-1 text-foreground" />
                <span>°C</span>
                <button type="button" disabled={salvandoHorario} onClick={salvarHorarioComercial} className="rounded-lg bg-orange-500 px-3 py-1.5 font-medium text-white hover:bg-orange-600 disabled:opacity-60">
                  {salvandoHorario ? "Salvando..." : "Salvar configurações"}
                </button>
              </div>
              <div className={`inline-flex items-center gap-2 text-sm font-medium ${foraDoHorario ? "text-amber-500" : "text-emerald-500"}`}>
                <Clock3 className="h-4 w-4" />
                {foraDoHorario ? "Fora do horário comercial" : "Dentro do horário comercial"}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4 text-orange-400" />
              <span>Dispositivo IoT</span>
              <input aria-label="ID do dispositivo IoT" type="text" value={deviceIdInput} onChange={(event) => setDeviceIdInput(event.target.value)} placeholder="Ex.: esp32-local-001" className="min-w-52 rounded-lg border border-border bg-card px-2 py-1 text-foreground" />
              <button type="button" disabled={salvandoDispositivo || !deviceIdInput.trim()} onClick={salvarDispositivo} className="rounded-lg bg-orange-500 px-3 py-1.5 font-medium text-white hover:bg-orange-600 disabled:opacity-60">
                {salvandoDispositivo ? "Vinculando..." : "Vincular dispositivo"}
              </button>
              <span className="text-xs">Somente leituras deste dispositivo aparecem nas suas estatísticas.</span>
            </div>
          </div>

          {(foraDoHorario || pessoasDetectadas) && (
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${foraDoHorario ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"}`}>
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {foraDoHorario && pessoasDetectadas ? `${textoPessoas} detectada${pessoasNoAmbiente === 1 ? "" : "s"} fora do horário comercial` : foraDoHorario ? "Estabelecimento fora do horário comercial" : `${textoPessoas} detectada${pessoasNoAmbiente === 1 ? "" : "s"} no estoque`}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  {pessoasDetectadas ? `O sensor de presença indica ${textoPessoas} no ambiente neste momento.` : `O horário configurado é das ${horarioInicio} às ${horarioFim}.`}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="stats-kpi-card stats-kpi-card--orange group flex min-h-[260px] flex-col rounded-[28px] border border-orange-500/15 p-5">
              <div className="flex h-12 items-start justify-between">
                <div className="rounded-2xl bg-orange-500/12 p-3 text-orange-300 ring-1 ring-orange-500/15">
                  <Thermometer className="h-7 w-7" />
                </div>
                <div className="text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <div className="flex items-center justify-end gap-2">
                    <span className="relative flex h-3 w-3" aria-label={ventilador.ligado ? "Ventilador ligado" : "Ventilador desligado"}>
                      {ventilador.ligado && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />}
                      <span className={`relative inline-flex h-3 w-3 rounded-full ${ventilador.ligado ? "bg-orange-400 shadow-[0_0_10px_3px_rgba(251,146,60,0.9)]" : "bg-zinc-500/50"}`} />
                    </span>
                    Temperatura
                  </div>
                  {ventilador.ligado && <div className="mt-1 text-sm font-semibold normal-case tracking-normal text-orange-400">Ventilador ligado</div>}
                </div>
              </div>
              <div className="mt-6 flex flex-1 flex-col">
                <div className="flex flex-1 items-center justify-center">
                  <div className="display-font text-center text-5xl font-bold text-foreground">
                    {formatTelemetryValue(telemetria.TEMPERATURE)}
                  </div>
                </div>
                <div className="min-h-12 space-y-1 text-left text-sm text-muted-foreground">
                  <div>Liga em {Number(ventilador.limite).toLocaleString("pt-BR")} °C</div>
                  <div>Desliga em {Number(ventilador.limiteDesligamento).toLocaleString("pt-BR")} °C</div>
                </div>
              </div>
            </div>

            <div className="stats-kpi-card stats-kpi-card--sky group flex min-h-[260px] flex-col rounded-[28px] border border-sky-500/15 p-5">
              <div className="flex h-12 items-start justify-between">
                <div className="rounded-2xl bg-sky-500/12 p-3 text-sky-300 ring-1 ring-sky-500/20">
                  <Activity className="h-7 w-7" />
                </div>
                <div className="text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Umidade</div>
              </div>
              <div className="mt-6 flex flex-1 flex-col">
                <div className="flex flex-1 items-center justify-center">
                  <div className="display-font text-center text-5xl font-bold text-foreground">
                    {formatTelemetryValue(telemetria.HUMIDITY)}
                  </div>
                </div>
                <div className="min-h-12" />
              </div>
            </div>

            <div className="stats-kpi-card stats-kpi-card--emerald group flex min-h-[260px] flex-col rounded-[28px] border border-emerald-500/15 p-5">
              <div className="flex h-12 items-start justify-between">
                <div className="rounded-2xl bg-emerald-500/12 p-3 text-emerald-300 ring-1 ring-emerald-500/15">
                  <Gauge className="h-7 w-7" />
                </div>
                <div className="text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Peso do estoque</div>
              </div>
              <div className="mt-6 flex flex-1 flex-col">
                <div className="flex flex-1 items-center justify-center">
                  <div className="display-font text-center text-5xl font-bold text-foreground">
                    {formatWeight(pesos.totalKg)}
                  </div>
                </div>
                <div className="mt-auto min-h-12 space-y-2 text-sm text-muted-foreground">
                  <div>Média: {formatWeight(pesos.mediaKg)}</div>
                  <div className="flex items-center justify-between">
                    <span>Desvio padrão: {formatOptionalWeight(pesos.desvioPadraoKg)}</span>
                    <span>{pesos.balancasComLeitura}/{pesos.balancasConfiguradas} balanças</span>
                  </div>
                  <div>Assimetria: {pesos.assimetria === null || pesos.assimetria === undefined ? "--" : Number(pesos.assimetria).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</div>
                </div>
              </div>
            </div>

            <div className="stats-kpi-card stats-kpi-card--orange group flex min-h-[260px] flex-col rounded-[28px] border border-orange-500/15 p-5">
              <div className="flex h-12 items-start justify-between">
                <div className="rounded-2xl bg-orange-500/12 p-3 text-orange-300 ring-1 ring-orange-500/15">
                  <UsersRound className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2 text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="relative flex h-3 w-3" aria-label={pessoasDetectadas ? "Movimento detectado" : "Nenhum movimento detectado"}>
                    {pessoasDetectadas && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />}
                    <span className={`relative inline-flex h-3 w-3 rounded-full ${pessoasDetectadas ? "bg-orange-400 shadow-[0_0_10px_3px_rgba(251,146,60,0.9)]" : "bg-zinc-500/50"}`} />
                  </span>
                  Presença
                </div>
              </div>
              <div className="mt-6 flex flex-1 flex-col">
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className={`display-font text-3xl font-bold ${pessoasDetectadas ? "text-amber-500" : "text-emerald-500"}`}>
                      {pessoasDetectadas ? textoPessoas : "Ambiente vazio"}
                    </div>
                    {pessoasDetectadas && <div className="mt-2 text-sm text-muted-foreground">detectada{pessoasNoAmbiente === 1 ? "" : "s"} no ambiente</div>}
                  </div>
                </div>
                <div className="min-h-12" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.7fr)_420px]">
            <section className="stats-panel rounded-[30px] border border-border p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="display-font text-2xl font-bold text-foreground">Compras no Período</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Compras registradas por pedidos concluídos no período selecionado.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Compras
                  </div>
                  {previsaoDisponivel ? (
                    <div className="flex items-center gap-2 text-cyan-300">
                      <span className="h-0 w-5 border-t-2 border-dashed border-cyan-300" />
                      Previsão · R² {previsaoCompras.rQuadrado === null || previsaoCompras.rQuadrado === undefined
                        ? "--"
                        : previsaoCompras.rQuadrado.toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 0 })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Previsão disponível após 2 períodos concluídos.</span>
                  )}
                </div>
              </div>

              <div className="stats-chart-surface relative overflow-hidden rounded-[24px] border border-border p-4">
                <div
                  className="pointer-events-none absolute top-5 z-10 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-lg"
                  style={{ left: `calc(${(picoX / larguraChart) * 100}% - 56px)` }}
                >
                  {legendaPico}
                </div>

                <svg
                  viewBox={`0 0 ${larguraChart} ${alturaChart}`}
                  className={`w-full ${rotacionarRotulosDoEixo ? "h-[390px]" : "h-[320px]"}`}
                >
                  <defs>
                    <linearGradient id="areaCompras" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient id="picoGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity="0.34" />
                      <stop offset="45%" stopColor="#fb923c" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="picoGuide" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fdba74" stopOpacity="0" />
                      <stop offset="18%" stopColor="#fdba74" stopOpacity="0.48" />
                      <stop offset="82%" stopColor="#fb923c" stopOpacity="0.36" />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {labelsEscala.map((valorEscala, index) => {
                    const y = padding + (index * (alturaChart - padding * 2)) / Math.max(labelsEscala.length - 1, 1);

                    return (
                      <g key={`${valorEscala}-${index}`}>
                        <line
                          x1={padding}
                          x2={larguraChart - padding}
                          y1={y}
                          y2={y}
                          stroke="var(--stats-grid-line)"
                          strokeDasharray="4 10"
                        />
                        <text x={padding - 12} y={y + 4} textAnchor="end" fontSize="12" fill="var(--stats-axis-strong)">
                          {valorEscala}
                        </text>
                      </g>
                    );
                  })}

                  <text x={padding - 12} y={24} textAnchor="end" fontSize="11" fill="var(--stats-axis-strong)">
                    Compras
                  </text>

                  <ellipse
                    cx={picoX}
                    cy={picoYCompras}
                    rx="64"
                    ry="108"
                    fill="url(#picoGlow)"
                  />
                  <rect
                    x={picoX - 1}
                    y={padding + 6}
                    width="2"
                    height={alturaChart - padding * 2 - 12}
                    rx="999"
                    fill="url(#picoGuide)"
                  />
                  <path d={areaCompras} fill="url(#areaCompras)" />
                  <path d={pathCompras} fill="none" stroke="#4ade80" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                  {previsaoDisponivel && (
                    <path d={pathPrevisao} fill="none" stroke="#67e8f9" strokeWidth="3" strokeDasharray="8 8" strokeLinejoin="round" strokeLinecap="round" />
                  )}

                  {labelsGrafico.map((label, index) => {
                    const isPrevisao = index >= comprasHistoricas.length;
                    const x = padding + (index * (larguraChart - padding * 2)) / Math.max(labelsGrafico.length - 1, 1);
                    const valor = isPrevisao
                      ? valoresPrevisao[index - comprasHistoricas.length]
                      : comprasHistoricas[index];
                    return (
                      <g key={`${label}-${index}`}>
                        <text
                          x={x}
                          y={alturaChart - (rotacionarRotulosDoEixo ? 16 : 4)}
                          textAnchor={rotacionarRotulosDoEixo ? "start" : "middle"}
                          fontSize={rotacionarRotulosDoEixo ? "11" : "12"}
                          fill="var(--stats-axis-bottom)"
                          transform={rotacionarRotulosDoEixo ? `rotate(-45 ${x} ${alturaChart - 16})` : undefined}
                        >
                          {formatChartLabel(label, visualizacao, hoje)}
                        </text>
                        <circle
                          cx={x}
                          cy={calcularY(valor, minEscala, rangeEscala, alturaChart, padding)}
                          r={isPrevisao ? 3.5 : index === picoIndex ? 6.5 : 4}
                          fill={isPrevisao ? "#0f172a" : "#dcfce7"}
                          stroke={isPrevisao ? "#67e8f9" : "#4ade80"}
                          strokeWidth="2"
                        />
                        {!isPrevisao && index === picoIndex && (
                          <circle
                            cx={x}
                            cy={calcularY(serieAtual.compras[index], minEscala, rangeEscala, alturaChart, padding)}
                            r="14"
                            fill="none"
                            stroke="rgba(251,146,60,0.3)"
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            <section className="stats-panel rounded-[30px] border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="display-font text-2xl font-bold text-foreground">Top Itens Vendidos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Ranking calculado pelos itens de pedidos concluídos.</p>
                </div>
                <ChartColumnIncreasing className="h-6 w-6 text-orange-400" />
              </div>

              <div className="mt-6 space-y-4">
                {serieAtual.topItens.length === 0 && (
                  <div className="stats-control-group rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                    Nenhum item vendido no período selecionado.
                  </div>
                )}
                {serieAtual.topItens.map((item, index) => {
                  const previsaoItem = previsoesTopItensPorId.get(item.id);
                  const previsaoItemDisponivel = previsaoItem?.previsao?.disponivel && previsaoItem.vendasPrevistas !== null;

                  return (
                  <div key={item.nome} className="stats-control-group rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
                          {item.imagemUrl ? (
                            <Image
                              src={item.imagemUrl}
                              alt={item.nome}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Bot className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{item.nome}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">rank #{index + 1}</div>
                        </div>
                      </div>
                      <div className="display-font text-2xl font-bold text-foreground">{item.vendas}</div>
                    </div>

                    <div className="stats-track mt-4 h-3 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${ITEM_COLORS[index % ITEM_COLORS.length]}`}
                        style={{ width: `${(item.vendas / Math.max(serieAtual.topItens[0]?.vendas ?? 1, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Previsão para os próximos períodos</span>
                      {previsaoItemDisponivel ? (
                        <span className="font-semibold text-cyan-300">
                          {Number(previsaoItem.vendasPrevistas).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} unidades
                        </span>
                      ) : (
                        <span>Dados insuficientes</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
