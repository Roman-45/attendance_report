package com.auca.attendance;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base class for all integration and API tests.
 *
 * Uses the manual singleton pattern: the container is started once statically
 * and never stopped between test classes. This prevents "Connection refused"
 * errors that occur when @Testcontainers stops the container after the first
 * test class finishes.
 *
 * Flyway runs all migrations automatically on startup so the schema is
 * always identical to production.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    // Singleton: started once for the entire JVM, never stopped between classes
    static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("attendance_test")
                .withUsername("test")
                .withPassword("test");
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void overrideDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",                POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username",           POSTGRES::getUsername);
        registry.add("spring.datasource.password",           POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }
}
