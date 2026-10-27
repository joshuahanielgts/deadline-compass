package com.deadlinemanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * Request body for POST /api/deadlines.
 *
 * <p>Bean Validation annotations enforce the field rules from AGENTS.md §4:
 * - title: required, 1–150 characters
 * - shortDescription: optional, max 200 characters
 * - longDescription: optional, max 5000 characters
 * - dueAt: required (must not be null; future-date check is done in the service)
 */
public record CreateDeadlineRequest(
        @NotBlank(message = "Title is required.")
        @Size(min = 1, max = 150, message = "Title must be between 1 and 150 characters.")
        String title,

        @Size(max = 200, message = "Short description must be 200 characters or fewer.")
        String shortDescription,

        @Size(max = 5000, message = "Long description must be 5000 characters or fewer.")
        String longDescription,

        @NotNull(message = "Due date is required.")
        Instant dueAt
) {
}
