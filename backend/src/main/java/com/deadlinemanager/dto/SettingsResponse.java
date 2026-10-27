package com.deadlinemanager.dto;

import com.deadlinemanager.model.AppSettings;

/**
 * DTO for reading and writing urgency threshold settings.
 *
 * <p>Field names match AGENTS.md §8 exactly. The service enforces:
 * 0 < redThresholdHours < yellowThresholdHours <= 8760.
 */
public record SettingsResponse(
        int redThresholdHours,
        int yellowThresholdHours
) {
    /**
     * Maps an AppSettings entity to this DTO.
     */
    public static SettingsResponse from(AppSettings s) {
        return new SettingsResponse(s.getRedThresholdHours(), s.getYellowThresholdHours());
    }
}
