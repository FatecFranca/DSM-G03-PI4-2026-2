package com.estokai.iot.infrastructure.mqtt.config;

import com.estokai.iot.infrastructure.mqtt.inbound.MqttTelemetryAdapter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Clock;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.util.StringUtils;

@Configuration
@EnableIntegration
@EnableConfigurationProperties(MqttProperties.class)
public class MqttConfiguration {
    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    MqttPahoClientFactory mqttClientFactory(MqttProperties properties) {
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{properties.brokerUrl()});
        options.setAutomaticReconnect(true);
        options.setCleanSession(false);
        if (StringUtils.hasText(properties.username())) {
            options.setUserName(properties.username());
        }
        if (StringUtils.hasText(properties.password())) {
            options.setPassword(properties.password().toCharArray());
        }
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    IntegrationFlow mqttInboundFlow(MqttPahoClientFactory factory, MqttProperties properties,
            MqttTelemetryAdapter telemetryAdapter) {
        var adapter = new MqttPahoMessageDrivenChannelAdapter(
                properties.clientId(), factory, properties.topic());
        adapter.setQos(properties.qos());
        return IntegrationFlow.from(adapter).handle(telemetryAdapter, "handle").get();
    }
}
