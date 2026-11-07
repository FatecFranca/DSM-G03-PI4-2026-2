package com.estokai.iot.domain.model;

public enum SensorType {
    WEIGHT,
    TEMPERATURE,
    HUMIDITY,
    MOTION;

    public static SensorType fromTopicSegment(String value) {
        return valueOf(value.toUpperCase());
    }
}
