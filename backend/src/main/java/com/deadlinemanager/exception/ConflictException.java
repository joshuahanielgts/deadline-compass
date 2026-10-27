package com.deadlinemanager.exception;

/**
 * Thrown for business-rule conflicts, e.g.:
 * - Completing an already-completed deadline → 409
 * - Restoring a deadline that is already active → 409
 *
 * Maps to HTTP 409 in GlobalExceptionHandler.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
