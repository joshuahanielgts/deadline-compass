package com.deadlinemanager.exception;

import java.util.Map;

/**
 * Thrown when business-rule validation fails (as opposed to Bean Validation).
 *
 * <p>Example: creating a deadline with a due date in the past, or saving
 * settings where red >= yellow. Carries optional field-level error messages
 * so the frontend can show them inline.
 *
 * <p>Maps to HTTP 400 in GlobalExceptionHandler.
 */
public class ValidationException extends RuntimeException {

    // Field-level error map: { "fieldName": "error message" }
    private final Map<String, String> fieldErrors;

    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }

    public ValidationException(String fieldName, String fieldMessage) {
        this("Validation failed", Map.of(fieldName, fieldMessage));
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
