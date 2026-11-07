package com.estokai.iot.infrastructure.mqtt.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mqtt")
public record MqttProperties(
        String brokerUrl,
        String clientId,
        String username,
        String password,
        String topic,
        int qos) {
}
