package com.deadlinemanager.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * Request body for PATCH /api/deadlines/{id}/due-date.
 *
 * <p>Changing the due date to a past instant is intentionally allowed
 * (the deadline will show as overdue). Only null is rejected here;
 * no future-date constraint on this operation per AGENTS.md §4.
 */
public record ChangeDueDateRequest(
        @NotNull(message = "Due date is required.")
        Instant dueAt
) {
}
