package com.deadlinemanager.dto;

import com.deadlinemanager.model.Deadline;
import java.time.Instant;

/**
 * Read-only DTO returned for every deadline response.
 *
 * <p>Field names must match AGENTS.md §8 exactly (camelCase JSON via Jackson).
 * This is a Java record — immutable, no setters needed.
 *
 * <p>Controllers NEVER return entities directly; they call DeadlineResponse.from(entity).
 */
public record DeadlineResponse(
        Long id,
        String title,
        String shortDescription,
        String longDescription,
        Instant dueAt,
        boolean completed,
        Instant createdAt,
        Instant completedAt
) {
    /**
     * Maps a Deadline entity to this DTO. Keeps business data out of the controller.
     */
    public static DeadlineResponse from(Deadline d) {
        return new DeadlineResponse(
                d.getId(),
                d.getTitle(),
                d.getShortDescription(),
                d.getLongDescription(),
                d.getDueAt(),
                d.isCompleted(),
                d.getCreatedAt(),
                d.getCompletedAt()
        );
    }
}
