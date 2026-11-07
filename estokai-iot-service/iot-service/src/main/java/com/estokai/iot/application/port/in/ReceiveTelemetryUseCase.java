package com.estokai.iot.application.port.in;

import com.estokai.iot.domain.model.TelemetryReading;

public interface ReceiveTelemetryUseCase {
    void receive(TelemetryReading reading);
}
