package com.estokai.iot.infrastructure.mqtt.inbound;

import com.estokai.iot.application.port.in.ReceiveTelemetryUseCase;
import com.estokai.iot.domain.model.SensorType;
import com.estokai.iot.domain.model.TelemetryReading;
import com.estokai.iot.infrastructure.mqtt.dto.SensorPayload;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
public class MqttTelemetryAdapter {
    private static final Logger log = LoggerFactory.getLogger(MqttTelemetryAdapter.class);
    private final ObjectMapper objectMapper;
    private final ReceiveTelemetryUseCase useCase;
    private final Clock clock;

    public MqttTelemetryAdapter(ObjectMapper objectMapper, ReceiveTelemetryUseCase useCase, Clock clock) {
        this.objectMapper = objectMapper;
        this.useCase = useCase;
        this.clock = clock;
    }

    public void handle(Message<?> message) {
        String topic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC, String.class);
        if (topic == null) throw new IllegalArgumentException("MQTT topic is required");
        String[] segments = topic.split("/");
        if (segments.length != 5) throw new IllegalArgumentException("Invalid telemetry topic: " + topic);

        try {
            SensorPayload payload = objectMapper.readValue(
                    String.valueOf(message.getPayload()), SensorPayload.class);
            Instant receivedAt = clock.instant();
            TelemetryReading reading = new TelemetryReading(segments[2], SensorType.fromTopicSegment(segments[4]),
                    payload.value(), payload.unit(), receivedAt, receivedAt);
            log.info("Telemetry received from MQTT. topic={}, deviceId={}, sensorType={}, value={}, unit={}",
                    topic, reading.deviceId(), reading.sensorType(), reading.value(), reading.unit());
            useCase.receive(reading);
        } catch (JsonProcessingException exception) {
            log.warn("Invalid telemetry payload on topic={}", topic, exception);
            throw new IllegalArgumentException("Invalid telemetry payload", exception);
        }
    }
}
