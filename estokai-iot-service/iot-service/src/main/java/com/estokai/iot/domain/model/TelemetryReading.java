package com.estokai.iot.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

public record TelemetryReading(
        String deviceId,
        SensorType sensorType,
        BigDecimal value,
        String unit,
        Instant measuredAt,
        Instant receivedAt)

{
    public TelemetryReading {
        if (deviceId == null || deviceId.isBlank()) throw new IllegalArgumentException("deviceId is required");
        Objects.requireNonNull(sensorType, "sensorType is required");
        Objects.requireNonNull(value, "value is required");
        if (unit == null || unit.isBlank()) throw new IllegalArgumentException("unit is required");
        Objects.requireNonNull(measuredAt, "measuredAt is required");
        Objects.requireNonNull(receivedAt, "receivedAt is required");
    }
}
