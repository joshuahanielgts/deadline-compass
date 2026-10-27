package com.deadlinemanager.controller;

import com.deadlinemanager.dto.SettingsResponse;
import com.deadlinemanager.dto.UpdateSettingsRequest;
import com.deadlinemanager.exception.GlobalExceptionHandler;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.service.SettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SettingsController.class)
@Import(GlobalExceptionHandler.class)
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SettingsService settingsService;

    @Test
    @DisplayName("GET /api/settings returns 200 with settings object")
    void testGetSettings() throws Exception {
        SettingsResponse resp = new SettingsResponse(24, 72);
        when(settingsService.getSettings()).thenReturn(resp);

        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.redThresholdHours").value(24))
                .andExpect(jsonPath("$.yellowThresholdHours").value(72));
    }

    @Test
    @DisplayName("PUT /api/settings updates settings successfully")
    void testUpdateSettingsSuccess() throws Exception {
        UpdateSettingsRequest req = new UpdateSettingsRequest(48, 96);
        SettingsResponse resp = new SettingsResponse(48, 96);

        when(settingsService.updateSettings(any(UpdateSettingsRequest.class))).thenReturn(resp);

        mockMvc.perform(put("/api/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redThresholdHours").value(48))
                .andExpect(jsonPath("$.yellowThresholdHours").value(96));
    }

    @Test
    @DisplayName("PUT /api/settings returns 400 on negative threshold")
    void testUpdateSettingsValidationNegative() throws Exception {
        UpdateSettingsRequest req = new UpdateSettingsRequest(-1, 72);

        mockMvc.perform(put("/api/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.redThresholdHours").exists());
    }

    @Test
    @DisplayName("PUT /api/settings returns 400 when service rejects red >= yellow")
    void testUpdateSettingsBusinessRuleConflict() throws Exception {
        UpdateSettingsRequest req = new UpdateSettingsRequest(72, 24);

        when(settingsService.updateSettings(any(UpdateSettingsRequest.class)))
                .thenThrow(new ValidationException("Red threshold must be strictly less than yellow threshold",
                        Map.of("yellowThresholdHours", "Must be greater than red threshold")));

        mockMvc.perform(put("/api/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.yellowThresholdHours").value("Must be greater than red threshold"));
    }
}
