import { apiRequest } from './api';

export function getLatestTelemetry() {
  return apiRequest('/telemetria/latest');
}

export function getTelemetryStatistics(visualizacao) {
  const query = new URLSearchParams({ visualizacao });
  return apiRequest(`/telemetria/estatisticas?${query.toString()}`);
}
