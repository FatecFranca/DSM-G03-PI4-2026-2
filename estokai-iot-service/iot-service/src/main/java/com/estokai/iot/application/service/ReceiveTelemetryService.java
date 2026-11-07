package com.estokai.iot.application.service;

import com.estokai.iot.application.port.in.ReceiveTelemetryUseCase;
import com.estokai.iot.application.port.out.PublishTelemetryEventPort;
import com.estokai.iot.domain.model.TelemetryReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ReceiveTelemetryService implements ReceiveTelemetryUseCase {
    private static final Logger log = LoggerFactory.getLogger(ReceiveTelemetryService.class);
    private final PublishTelemetryEventPort publisher;

    public ReceiveTelemetryService(PublishTelemetryEventPort publisher) {
        this.publisher = publisher;
    }

    @Override
    public void receive(TelemetryReading reading) {
        log.info("Telemetry accepted by application layer. deviceId={}, sensorType={}, value={}, unit={} measuredAt={}",
                reading.deviceId(), reading.sensorType(),reading.value(),reading.unit(), reading.measuredAt());
        publisher.publish(reading);
    }
}
