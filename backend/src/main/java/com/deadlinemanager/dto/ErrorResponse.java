package com.deadlinemanager.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Uniform error response body returned for all non-2xx responses.
 *
 * <p>Shape from AGENTS.md §8:
 * { "timestamp", "status", "error", "message", "fieldErrors": { "field": "msg" } }
 *
 * <p>No stack traces, no SQL, no internal details are ever included.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors
) {
    /**
     * Convenience factory for errors that have field-level validation messages.
     */
    public static ErrorResponse of(int status, String error, String message, Map<String, String> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, error, message, fieldErrors);
    }

    /**
     * Convenience factory for errors without field-level messages.
     */
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(Instant.now(), status, error, message, Map.of());
    }
}
