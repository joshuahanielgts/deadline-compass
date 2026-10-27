package com.deadlinemanager.service;

import com.deadlinemanager.dto.SettingsResponse;
import com.deadlinemanager.dto.UpdateSettingsRequest;
import com.deadlinemanager.exception.NotFoundException;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.model.AppSettings;
import com.deadlinemanager.repository.AppSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Business logic for urgency threshold settings.
 *
 * <p>Validation rule (AGENTS.md §5): integers, 0 < red < yellow <= 8760.
 * The DB also enforces this via CHECK constraint, but we check in code first
 * to return a user-friendly 400 with fieldErrors instead of a DB exception.
 *
 * <p>The settings row (id=1) is always present — inserted by V1 migration.
 */
@Service
public class SettingsService {

    // Maximum allowed value for the yellow threshold: one year in hours.
    private static final int MAX_THRESHOLD_HOURS = 8760;

    private final AppSettingsRepository settingsRepository;

    public SettingsService(AppSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    /** Returns the current urgency thresholds. */
    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {
        return SettingsResponse.from(loadSettings());
    }

    /**
     * Updates urgency thresholds. Validates that 0 < red < yellow <= 8760.
     *
     * <p>Cross-field validation (red < yellow) is done here in code because
     * Bean Validation cannot compare two fields without a custom class-level annotation.
     */
    @Transactional
    public SettingsResponse updateSettings(UpdateSettingsRequest req) {
        // Collect all validation errors before throwing, so the client sees them all at once.
        Map<String, String> errors = new LinkedHashMap<>();

        int red = req.redThresholdHours() != null ? req.redThresholdHours() : 0;
        int yellow = req.yellowThresholdHours() != null ? req.yellowThresholdHours() : 0;

        // Rule: red must be a positive integer (Bean Validation handles null/<=0 already,
        // but we re-check here for the service-layer test path).
        if (red <= 0) {
            errors.put("redThresholdHours", "Red threshold must be greater than 0.");
        }

        // Rule: yellow must not exceed 8760 hours (one year).
        if (yellow > MAX_THRESHOLD_HOURS) {
            errors.put("yellowThresholdHours", "Yellow threshold must be at most 8760 hours (one year).");
        }

        // Cross-field rule: red must be strictly less than yellow.
        if (errors.isEmpty() && red >= yellow) {
            errors.put("yellowThresholdHours", "Yellow threshold must be greater than the red threshold.");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Settings validation failed", errors);
        }

        AppSettings settings = loadSettings();
        settings.setRedThresholdHours(red);
        settings.setYellowThresholdHours(yellow);
        settings.setUpdatedAt(Instant.now());
        return SettingsResponse.from(settingsRepository.save(settings));
    }

    // ---- Private helpers ----

    private AppSettings loadSettings() {
        return settingsRepository.findById((short) 1)
                .orElseThrow(() -> new NotFoundException("Settings not found — V1 migration may not have run."));
    }
}
