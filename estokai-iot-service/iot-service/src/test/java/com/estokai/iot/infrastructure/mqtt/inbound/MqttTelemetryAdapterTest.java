package com.estokai.iot.infrastructure.mqtt.inbound;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.estokai.iot.application.port.in.ReceiveTelemetryUseCase;
import com.estokai.iot.domain.model.SensorType;
import com.estokai.iot.domain.model.TelemetryReading;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

class MqttTelemetryAdapterTest {

    @Test
    void should_Receive_Weight_Telemetry_From_Scale_Topic() {
        CapturingReceiveTelemetryUseCase useCase = new CapturingReceiveTelemetryUseCase();
        MqttTelemetryAdapter adapter = buildAdapter(useCase);
        Instant receivedAt = Instant.parse("2026-08-18T12:35:00Z");
        Message<String> message = MessageBuilder.withPayload("""
                {"value":12.345,"unit":"kg","timestamp":"2026-08-18T12:30:00Z"}
                """.trim())
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "estokai/devices/balanca-01/telemetry/weight")
                .build();

        adapter.handle(message);

        TelemetryReading reading = useCase.receivedReading;
        assertEquals("balanca-01", reading.deviceId());
        assertEquals(SensorType.WEIGHT, reading.sensorType());
        assertEquals(new BigDecimal("12.345"), reading.value());
        assertEquals("kg", reading.unit());
        assertEquals(receivedAt, reading.measuredAt());
        assertEquals(receivedAt, reading.receivedAt());
    }

    @Test
    void should_Receive_Humidity_Telemetry_From_Dht_Topic() {
        CapturingReceiveTelemetryUseCase useCase = new CapturingReceiveTelemetryUseCase();
        MqttTelemetryAdapter adapter = buildAdapter(useCase);
        Instant receivedAt = Instant.parse("2026-08-18T12:35:00Z");
        Message<String> message = MessageBuilder.withPayload("""
                {"value":61.5,"unit":"%","timestamp":"2026-08-18T12:30:00Z"}
                """.trim())
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "estokai/devices/esp32-001/telemetry/humidity")
                .build();

        adapter.handle(message);

        TelemetryReading reading = useCase.receivedReading;
        assertEquals("esp32-001", reading.deviceId());
        assertEquals(SensorType.HUMIDITY, reading.sensorType());
        assertEquals(new BigDecimal("61.5"), reading.value());
        assertEquals("%", reading.unit());
        assertEquals(receivedAt, reading.measuredAt());
        assertEquals(receivedAt, reading.receivedAt());
    }

    @Test
    void should_Reject_Invalid_Payload_For_Scale_Telemetry() {
        CapturingReceiveTelemetryUseCase useCase = new CapturingReceiveTelemetryUseCase();
        MqttTelemetryAdapter adapter = buildAdapter(useCase);
        Message<String> message = MessageBuilder.withPayload("{invalid-json}")
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "estokai/devices/balanca-01/telemetry/weight")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> adapter.handle(message));

        assertEquals("Invalid telemetry payload", exception.getMessage());
        assertInstanceOf(com.fasterxml.jackson.core.JsonProcessingException.class, exception.getCause());
        assertNull(useCase.receivedReading);
    }

    @Test
    void should_Reject_Invalid_Scale_Topic() {
        CapturingReceiveTelemetryUseCase useCase = new CapturingReceiveTelemetryUseCase();
        MqttTelemetryAdapter adapter = buildAdapter(useCase);
        Message<String> message = MessageBuilder.withPayload("""
                {"value":12.345,"unit":"kg","timestamp":"2026-08-18T12:30:00Z"}
                """.trim())
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "estokai/devices/balanca-01/weight")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> adapter.handle(message));

        assertEquals("Invalid telemetry topic: estokai/devices/balanca-01/weight", exception.getMessage());
        assertNull(useCase.receivedReading);
    }

    private MqttTelemetryAdapter buildAdapter(ReceiveTelemetryUseCase useCase) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        Clock clock = Clock.fixed(Instant.parse("2026-08-18T12:35:00Z"), ZoneOffset.UTC);
        return new MqttTelemetryAdapter(objectMapper, useCase, clock);
    }

    private static final class CapturingReceiveTelemetryUseCase implements ReceiveTelemetryUseCase {
        private TelemetryReading receivedReading;

        @Override
        public void receive(TelemetryReading reading) {
            this.receivedReading = reading;
        }
    }
}
