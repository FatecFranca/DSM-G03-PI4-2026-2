package com.estokai.iot.infrastructure.rabbitmq.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rabbitmq.telemetry")
public record RabbitTelemetryProperties(
        String exchange,
        String queue,
        String routingKey) {
}
