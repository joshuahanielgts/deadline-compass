package com.deadlinemanager.exception;

import com.deadlinemanager.dto.ErrorResponse;
import com.fasterxml.jackson.core.JsonParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central error handler for all REST controllers.
 *
 * <p>Rules from AGENTS.md §8 and §9:
 * - 400 for validation failures (Bean Validation or business rules) with fieldErrors map
 * - 404 for not found
 * - 409 for conflict (double-complete, restore-active)
 * - 500 for unexpected errors
 * - NEVER return stack traces or SQL details to the client
 * - Log unexpected errors server-side so they can be investigated
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles Bean Validation failures from @Valid-annotated request bodies.
     * Collects all field errors into the fieldErrors map.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            // Keep the first error per field; don't overwrite with later errors.
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, "Bad Request", "Validation failed", fieldErrors));
    }

    /**
     * Handles our custom business-rule validation exception (e.g. past due date on create,
     * invalid settings thresholds).
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, "Bad Request", ex.getMessage(), ex.getFieldErrors()));
    }

    /**
     * Handles malformed JSON in the request body (e.g. syntax errors, wrong types).
     * Returns 400 with a generic message — no raw parse details exposed.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex) {
        // Log at debug level — this is a client error, not a server error.
        log.debug("Malformed request body: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, "Bad Request", "Malformed or unreadable request body"));
    }

    /**
     * Handles raw Jackson parse exceptions (edge case, usually caught by the above).
     */
    @ExceptionHandler(JsonParseException.class)
    public ResponseEntity<ErrorResponse> handleJsonParse(JsonParseException ex) {
        log.debug("JSON parse error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, "Bad Request", "Malformed JSON in request body"));
    }

    /**
     * Handles resource-not-found cases (e.g. deadline ID doesn't exist).
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, "Not Found", ex.getMessage()));
    }

    /**
     * Handles business-rule conflicts (e.g. completing an already-completed deadline).
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(409, "Conflict", ex.getMessage()));
    }

    /**
     * Catch-all for unexpected errors. Logs the full exception server-side but
     * returns only a generic message to the client (no stack traces, no SQL).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error handling request", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500, "Internal Server Error", "An unexpected error occurred"));
    }
}
