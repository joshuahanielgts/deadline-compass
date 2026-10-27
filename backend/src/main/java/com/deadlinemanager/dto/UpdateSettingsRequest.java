package com.deadlinemanager.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request body for PUT /api/settings.
 *
 * <p>Bean Validation catches obviously invalid values (null, non-positive, >8760).
 * The service layer additionally validates that red < yellow (cross-field rule).
 */
public record UpdateSettingsRequest(
        @NotNull(message = "Red threshold is required.")
        @Positive(message = "Red threshold must be greater than 0.")
        @Max(value = 8759, message = "Red threshold must be less than yellow threshold (max 8759).")
        Integer redThresholdHours,

        @NotNull(message = "Yellow threshold is required.")
        @Positive(message = "Yellow threshold must be greater than 0.")
        @Max(value = 8760, message = "Yellow threshold must be at most 8760 (one year).")
        Integer yellowThresholdHours
) {
}
