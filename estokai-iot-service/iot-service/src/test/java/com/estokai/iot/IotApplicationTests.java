package com.estokai.iot;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

class IotApplicationTests {

	@Test
	void applicationIsMarkedAsSpringBootApplication() {
		assertNotNull(IotApplication.class.getAnnotation(SpringBootApplication.class));
	}

}
