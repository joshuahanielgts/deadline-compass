package com.deadlinemanager.controller;

import com.deadlinemanager.dto.SettingsResponse;
import com.deadlinemanager.dto.UpdateSettingsRequest;
import com.deadlinemanager.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for urgency threshold settings.
 *
 * <p>Paths match AGENTS.md §8 exactly.
 * Controllers return DTO records, never entities.
 */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    /** GET /api/settings — returns current urgency thresholds */
    @GetMapping
    public SettingsResponse getSettings() {
        return settingsService.getSettings();
    }

    /** PUT /api/settings — updates urgency thresholds */
    @PutMapping
    public SettingsResponse updateSettings(@Valid @RequestBody UpdateSettingsRequest req) {
        return settingsService.updateSettings(req);
    }
}
