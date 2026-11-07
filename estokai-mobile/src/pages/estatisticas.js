import Screen from '../components/Screen';
import { AppHeader } from '../components/Headers';
import { BaseCard, MetricCard } from '../components/Cards';
import { getLatestTelemetry, getTelemetryStatistics } from '../services/telemetria';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { getStyles } from '../styles/estatisticasstyles';
import { useTheme } from '../context/ThemeContext';

const PERIODOS = [
  { label: 'Hoje', value: 'Dia' },
  { label: 'Semana', value: 'Semana' },
  { label: 'Mês', value: 'Mes' },
];

const emptyStatistics = {
  labels: [],
  compras: [],
  topItens: [],
  pesos: { totalKg: 0 },
};

const CHART_WIDTH = 360;
const CHART_HEIGHT = 190;
const CHART_PADDING = { top: 16, right: 12, bottom: 30, left: 30 };

function readingsByType(readings) {
  return readings.reduce((result, reading) => {
    if (!result[reading.sensorType]) result[reading.sensorType] = reading;
    return result;
  }, {});
}

function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits });
}

function formatTemperature(reading) {
  if (!reading) return '--';
  return `${formatNumber(reading.value)} ${reading.unit || '°C'}`;
}

function formatHumidity(reading) {
  if (!reading) return '--';
  return `${formatNumber(reading.value)}${reading.unit === '%' ? '%' : ` ${reading.unit || '%'}`}`;
}

function createPath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function formatR2(value) {
  return value === null || value === undefined
    ? '--'
    : `${Math.round(Number(value) * 100)}%`;
}

function formatOptionalNumber(value, maximumFractionDigits = 3) {
  return value === null || value === undefined ? '--' : formatNumber(value, maximumFractionDigits);
}

function formatWeight(value) {
  return `${formatNumber(value, 3)} kg`;
}

function formatOptionalWeight(value) {
  return value === null || value === undefined ? '--' : formatWeight(value);
}

export default function Estatisticas({ navigation }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [periodo, setPeriodo] = useState('Semana');
  const [telemetria, setTelemetria] = useState(/** @type {Record<string, { value?: number, unit?: string }>} */ ({}));
  const [estatisticas, setEstatisticas] = useState(emptyStatistics);
  const [loading, setLoading] = useState(true);

  const carregarEstatisticas = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [readings, stats] = await Promise.all([
        getLatestTelemetry(),
        getTelemetryStatistics(periodo),
      ]);
      setTelemetria(readingsByType(readings ?? []));
      setEstatisticas(stats ?? emptyStatistics);
    } catch (error) {
      Alert.alert('Erro', `Não foi possível carregar as estatísticas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useFocusEffect(useCallback(() => {
    void carregarEstatisticas();
  }, [carregarEstatisticas]));

  const chart = useMemo(() => {
    const previsao = estatisticas.previsoes?.compras;
    const hasForecast = Boolean(previsao?.disponivel && previsao.valores?.length);
    const historyCount = hasForecast
      ? Math.max(1, Math.min(Number(previsao.pontosTreino ?? 0), estatisticas.compras?.length ?? 0))
      : estatisticas.compras?.length ?? 0;
    const historicValues = (estatisticas.compras ?? []).slice(0, historyCount).map(Number);
    const forecastValues = hasForecast ? previsao.valores.map(Number) : [];
    const labels = hasForecast
      ? [...(estatisticas.labels ?? []).slice(0, historyCount), ...(previsao.labels ?? [])]
      : (estatisticas.labels ?? []).slice(0, historyCount);
    const values = [...historicValues, ...forecastValues];
    const maxValue = Math.max(...values, 1);
    const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const points = values.map((value, index) => ({
      x: CHART_PADDING.left + (index * innerWidth) / Math.max(values.length - 1, 1),
      y: CHART_PADDING.top + innerHeight - (value / maxValue) * innerHeight,
      value,
      label: labels[index] ?? '',
    }));

    return {
      hasForecast,
      rQuadrado: previsao?.rQuadrado,
      maxValue,
      historic: points.slice(0, historicValues.length),
      forecast: points.slice(historicValues.length),
      points,
    };
  }, [estatisticas]);

  const topProdutos = estatisticas.topItens ?? [];
  const peopleNow = Math.max(Math.round(Number(telemetria.MOTION?.value ?? 0)), 0);
  const pesos = estatisticas.pesos ?? emptyStatistics.pesos;

  return (
    <Screen activeRoute="Estatisticas" onSelectRoute={(route) => navigation.navigate(route)}>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={carregarEstatisticas} />}
      >
        {/* HEADER SUPERIOR */}
        <AppHeader category="ESTATÍSTICAS" title="Visão geral" subtitle="Indicadores e desempenho do estoque." onSettings={() => navigation.getParent()?.navigate('Configuracoes')} />

        <View style={styles.periodContainer} accessibilityRole="tablist">
          {PERIODOS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.periodButton, periodo === item.value && styles.periodButtonActive]}
              onPress={() => setPeriodo(item.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: periodo === item.value }}
            >
              <Text style={[styles.periodText, periodo === item.value && styles.periodTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowCards}>
          <MetricCard label="TEMPERATURA" value={formatTemperature(telemetria.TEMPERATURE)} caption="Agora" />

          <MetricCard label="UMIDADE" value={formatHumidity(telemetria.HUMIDITY)} caption="Agora" />
        </View>

        {/* LINHA 2 DE MINI CARDS */}
        <View style={styles.rowCards}>
          <MetricCard
            label="PESO EM ESTOQUE"
            value={formatWeight(pesos.totalKg)}
            caption={`${pesos.balancasComLeitura ?? 0}/${pesos.balancasConfiguradas ?? 0} balanças com leitura`}
            positive
            details={[
              `Média: ${formatWeight(pesos.mediaKg)}`,
              `Desvio padrão: ${formatOptionalWeight(pesos.desvioPadraoKg)}`,
              `Assimetria: ${formatOptionalNumber(pesos.assimetria)}`,
            ]}
          />

          <MetricCard
            label="PESSOAS"
            value={String(peopleNow)}
            caption={peopleNow > 0 ? `${peopleNow === 1 ? 'Pessoa detectada' : 'Pessoas detectadas'} no ambiente` : 'Ambiente vazio'}
            positive={peopleNow === 0}
          />
        </View>

        {/* GRÁFICO DE MOVIMENTAÇÃO */}
        <BaseCard>
          <Text style={styles.chartTitle}>Compras no período</Text>
          <Text style={styles.chartSub}>Pedidos concluídos no período selecionado</Text>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={styles.legendHistoric} /><Text style={styles.legendText}>Compras</Text></View>
            {chart.hasForecast && <View style={styles.legendItem}><View style={styles.legendForecast} /><Text style={styles.legendText}>Previsão · R² {formatR2(chart.rQuadrado)}</Text></View>}
          </View>

          {!chart.hasForecast && chart.points.length > 0 && <Text style={styles.forecastUnavailable}>Previsão disponível após 2 períodos concluídos.</Text>}

          {chart.points.length > 0 ? (
            <View key={periodo} style={styles.lineChartContainer}>
              <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                {[0, 0.5, 1].map((position) => {
                  const y = CHART_PADDING.top + (1 - position) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
                  return <Line key={position} x1={CHART_PADDING.left} x2={CHART_WIDTH - CHART_PADDING.right} y1={y} y2={y} stroke="#6B7280" strokeOpacity="0.25" strokeDasharray="4 6" />;
                })}
                <SvgText x={CHART_PADDING.left - 5} y={CHART_PADDING.top + 4} fill="#888888" fontSize="10" textAnchor="end">{formatNumber(chart.maxValue, 0)}</SvgText>
                <SvgText x={CHART_PADDING.left - 5} y={CHART_HEIGHT - CHART_PADDING.bottom + 4} fill="#888888" fontSize="10" textAnchor="end">0</SvgText>
                {chart.historic.length > 1 && <Path d={createPath(chart.historic)} fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                {chart.hasForecast && chart.forecast.length > 0 && <Path d={createPath([chart.historic[chart.historic.length - 1], ...chart.forecast])} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />}
                {chart.points.map((point, index) => {
                  const forecastPoint = index >= chart.historic.length;
                  const showLabel = index === 0 || index === chart.points.length - 1 || index % Math.ceil(chart.points.length / 5) === 0;
                  return (
                    <React.Fragment key={`${point.label}-${index}`}>
                      <Circle cx={point.x} cy={point.y} r={forecastPoint ? 3 : 3.5} fill={forecastPoint ? (isDarkMode ? '#171717' : '#FFFFFF') : '#DCFCE7'} stroke={forecastPoint ? '#22D3EE' : '#4CAF50'} strokeWidth="2" />
                      {showLabel && <SvgText x={point.x} y={CHART_HEIGHT - 8} fill="#888888" fontSize="9" textAnchor="middle">{point.label}</SvgText>}
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          ) : !loading && <Text style={styles.emptyText}>Nenhum pedido concluído no período.</Text>}
        </BaseCard>

        {/* TOP PRODUTOS VENDIDOS */}
        <BaseCard>
          <Text style={styles.chartTitle}>Top itens vendidos</Text>
          <Text style={styles.chartSub}>Ranking dos pedidos concluídos no período</Text>

          {topProdutos.map((prod, index) => (
            <View key={prod.id} style={styles.produtoRow}>
              <View style={styles.produtoInfo}>
                <Text style={styles.produtoRank}>{index + 1}</Text>
                <Text style={styles.produtoNome}>{prod.nome}</Text>
              </View>
              <Text style={styles.produtoQtd}>{formatNumber(prod.vendas, 0)} un</Text>
            </View>
          ))}
          {!loading && topProdutos.length === 0 && <Text style={styles.emptyText}>Nenhum item vendido no período.</Text>}
        </BaseCard>

        {loading && <ActivityIndicator size="small" color="#FF6B00" style={styles.loader} />}
      </ScrollView>

    </Screen>
  );
}
