package com.estokai.iot.infrastructure.mqtt.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SensorPayload(
        String deviceId,
        BigDecimal value,
        String unit,
        Instant timestamp) {
}
