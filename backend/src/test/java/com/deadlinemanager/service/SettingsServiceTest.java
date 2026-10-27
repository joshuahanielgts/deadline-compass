package com.deadlinemanager.service;

import com.deadlinemanager.dto.SettingsResponse;
import com.deadlinemanager.dto.UpdateSettingsRequest;
import com.deadlinemanager.exception.NotFoundException;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.model.AppSettings;
import com.deadlinemanager.repository.AppSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private AppSettingsRepository appSettingsRepository;

    private SettingsService settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new SettingsService(appSettingsRepository);
    }

    @Test
    @DisplayName("getSettings returns current settings when present")
    void testGetSettingsPresent() {
        AppSettings settings = new AppSettings();
        settings.setId((short) 1);
        settings.setRedThresholdHours(24);
        settings.setYellowThresholdHours(72);

        when(appSettingsRepository.findById((short) 1)).thenReturn(Optional.of(settings));

        SettingsResponse resp = settingsService.getSettings();
        assertEquals(24, resp.redThresholdHours());
        assertEquals(72, resp.yellowThresholdHours());
    }

    @Test
    @DisplayName("getSettings throws NotFoundException when settings row is missing")
    void testGetSettingsNotFound() {
        when(appSettingsRepository.findById((short) 1)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> settingsService.getSettings());
    }

    @Test
    @DisplayName("updateSettings succeeds when 0 < red < yellow <= 8760")
    void testUpdateSettingsSuccess() {
        AppSettings settings = new AppSettings();
        settings.setId((short) 1);
        settings.setRedThresholdHours(24);
        settings.setYellowThresholdHours(72);

        when(appSettingsRepository.findById((short) 1)).thenReturn(Optional.of(settings));
        when(appSettingsRepository.save(any(AppSettings.class))).thenAnswer(i -> i.getArgument(0));

        UpdateSettingsRequest req = new UpdateSettingsRequest(48, 96);
        SettingsResponse resp = settingsService.updateSettings(req);

        assertEquals(48, resp.redThresholdHours());
        assertEquals(96, resp.yellowThresholdHours());
    }

    @Test
    @DisplayName("updateSettings rejects red >= yellow")
    void testUpdateSettingsRejectsRedGreaterOrEqualYellow() {
        UpdateSettingsRequest req = new UpdateSettingsRequest(72, 24);

        ValidationException ex = assertThrows(ValidationException.class, () -> settingsService.updateSettings(req));
        assertTrue(ex.getFieldErrors().containsKey("yellowThresholdHours"));
    }

    @Test
    @DisplayName("updateSettings rejects red == yellow")
    void testUpdateSettingsRejectsRedEqualToYellow() {
        UpdateSettingsRequest req = new UpdateSettingsRequest(48, 48);

        ValidationException ex = assertThrows(ValidationException.class, () -> settingsService.updateSettings(req));
        assertTrue(ex.getFieldErrors().containsKey("yellowThresholdHours"));
    }

    @Test
    @DisplayName("updateSettings rejects yellow > 8760")
    void testUpdateSettingsRejectsYellowOver8760() {
        UpdateSettingsRequest req = new UpdateSettingsRequest(24, 8761);

        ValidationException ex = assertThrows(ValidationException.class, () -> settingsService.updateSettings(req));
        assertTrue(ex.getFieldErrors().containsKey("yellowThresholdHours"));
    }
}
