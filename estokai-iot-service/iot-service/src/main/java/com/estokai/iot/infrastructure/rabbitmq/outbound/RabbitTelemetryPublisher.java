package com.estokai.iot.infrastructure.rabbitmq.outbound;

import com.estokai.iot.application.port.out.PublishTelemetryEventPort;
import com.estokai.iot.domain.model.TelemetryReading;
import com.estokai.iot.infrastructure.rabbitmq.config.RabbitTelemetryProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class RabbitTelemetryPublisher implements PublishTelemetryEventPort {
    private static final Logger log = LoggerFactory.getLogger(RabbitTelemetryPublisher.class);
    private final RabbitTemplate rabbitTemplate;
    private final RabbitTelemetryProperties properties;

    public RabbitTelemetryPublisher(RabbitTemplate rabbitTemplate, RabbitTelemetryProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    @Override
    public void publish(TelemetryReading reading) {
        rabbitTemplate.convertAndSend(properties.exchange(), properties.routingKey(), reading);
        log.info("Telemetry published to RabbitMQ. exchange={}, routingKey={}, deviceId={}, sensorType={}",
                properties.exchange(), properties.routingKey(), reading.deviceId(), reading.sensorType());
    }
}
