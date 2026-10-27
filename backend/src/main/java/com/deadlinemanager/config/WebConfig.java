package com.deadlinemanager.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * CORS configuration matching AGENTS.md §9.
 * Origins are supplied via CORS_ALLOWED_ORIGINS environment variable or app.cors.allowed-origins.
 * Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
 * Allowed header: Content-Type.
 * Wildcard '*' is strictly prohibited.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebConfig(
            @Value("${app.cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000,http://127.0.0.1:3000}}")
            String origins
    ) {
        this.allowedOrigins = Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type")
                .allowCredentials(false);
    }
}
