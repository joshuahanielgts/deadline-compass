package com.deadlinemanager.exception;

/**
 * Thrown when a requested resource (e.g. deadline by id) does not exist.
 * Maps to HTTP 404 in GlobalExceptionHandler.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
