const lastValues = new Map()

const DEFAULT_THRESHOLDS = {
  TEMPERATURE: 0.1,
  HUMIDITY: 1,
}

function getKey(reading) {
  return `${reading.deviceId}:${reading.sensorType}`
}

function getThreshold(sensorType) {
  return DEFAULT_THRESHOLDS[sensorType] ?? 0
}

export function shouldEmitTelemetry(reading) {
  const key = getKey(reading)
  const previous = lastValues.get(key)
  lastValues.set(key, reading.value)

  if (previous === undefined) {
    return true
  }

  const threshold = getThreshold(reading.sensorType)
  return Math.abs(reading.value - previous) >= threshold
}
