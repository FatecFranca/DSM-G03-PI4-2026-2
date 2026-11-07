package com.estokai.iot.application.port.out;

import com.estokai.iot.domain.model.TelemetryReading;

public interface PublishTelemetryEventPort {
    void publish(TelemetryReading reading);
}
