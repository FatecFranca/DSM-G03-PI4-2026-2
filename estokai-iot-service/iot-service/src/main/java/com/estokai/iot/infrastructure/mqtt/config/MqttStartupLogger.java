package com.estokai.iot.infrastructure.mqtt.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MqttStartupLogger {
    private static final Logger log = LoggerFactory.getLogger(MqttStartupLogger.class);

    @Bean
    ApplicationRunner mqttConfigurationLogger(MqttProperties properties) {
        return args -> log.info("MQTT inbound configured. brokerUrl={}, clientId={}, topic={}, qos={}",
                properties.brokerUrl(), properties.clientId(), properties.topic(), properties.qos());
    }
}
