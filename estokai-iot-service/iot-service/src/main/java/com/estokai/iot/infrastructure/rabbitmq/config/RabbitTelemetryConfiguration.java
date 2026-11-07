package com.estokai.iot.infrastructure.rabbitmq.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RabbitTelemetryProperties.class)
public class RabbitTelemetryConfiguration {
    @Bean
    MessageConverter telemetryMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    TopicExchange telemetryExchange(RabbitTelemetryProperties p) {
        return new TopicExchange(p.exchange(), true, false);
    }

    @Bean
    Queue telemetryQueue(RabbitTelemetryProperties p) {
        return new Queue(p.queue(), true);
    }

    @Bean
    Binding telemetryBinding(Queue queue, TopicExchange exchange, RabbitTelemetryProperties p) {
        return BindingBuilder.bind(queue).to(exchange).with(p.routingKey());
    }
}
