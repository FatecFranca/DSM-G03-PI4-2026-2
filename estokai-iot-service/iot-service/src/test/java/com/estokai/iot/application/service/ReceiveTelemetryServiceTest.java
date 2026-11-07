package com.estokai.iot.application.service;

import static org.junit.jupiter.api.Assertions.assertSame;

import com.estokai.iot.application.port.out.PublishTelemetryEventPort;
import com.estokai.iot.domain.model.SensorType;
import com.estokai.iot.domain.model.TelemetryReading;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ReceiveTelemetryServiceTest {

    @Test
    void should_Publish_Weight_Telemetry_Received_From_Scale_1() {
        CapturingPublishTelemetryEventPort publisher = new CapturingPublishTelemetryEventPort();
        ReceiveTelemetryService service = new ReceiveTelemetryService(publisher);
        TelemetryReading reading = new TelemetryReading(
                "balanca-01",
                SensorType.WEIGHT,
                new BigDecimal("12.345"),
                "kg",
                Instant.parse("2026-08-18T12:30:00Z"),
                Instant.parse("2026-08-18T12:30:03Z"));

        service.receive(reading);

        assertSame(reading, publisher.publishedReading);
    }

    @Test
    void should_Publish_Weight_Telemetry_Received_From_Scale_2() {
        CapturingPublishTelemetryEventPort publisher = new CapturingPublishTelemetryEventPort();
        ReceiveTelemetryService service = new ReceiveTelemetryService(publisher);
        TelemetryReading reading = new TelemetryReading(
                "temperatura-01",
                SensorType.TEMPERATURE,
                new BigDecimal("27"),
                "C",
                Instant.parse("2026-08-18T12:30:00Z"),
                Instant.parse("2026-08-18T12:30:03Z"));

        service.receive(reading);

        assertSame(reading, publisher.publishedReading);
    }

    @Test
    void should_Publish_Weight_Telemetry_Received_From_Scale_3() {
        CapturingPublishTelemetryEventPort publisher = new CapturingPublishTelemetryEventPort();
        ReceiveTelemetryService service = new ReceiveTelemetryService(publisher);
        TelemetryReading reading = new TelemetryReading(
                "Movimento-01",
                SensorType.MOTION,
                new BigDecimal("40"),
                "cm",
                Instant.parse("2026-08-18T12:30:00Z"),
                Instant.parse("2026-08-18T12:30:03Z"));

        service.receive(reading);

        assertSame(reading, publisher.publishedReading);
    }

    private static final class CapturingPublishTelemetryEventPort implements PublishTelemetryEventPort {
        private TelemetryReading publishedReading;

        @Override
        public void publish(TelemetryReading reading) {
            this.publishedReading = reading;
        }
    }
}
