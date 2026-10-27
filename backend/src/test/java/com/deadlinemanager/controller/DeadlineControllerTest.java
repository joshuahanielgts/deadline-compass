package com.deadlinemanager.controller;

import com.deadlinemanager.dto.ChangeDueDateRequest;
import com.deadlinemanager.dto.CreateDeadlineRequest;
import com.deadlinemanager.dto.DeadlineResponse;
import com.deadlinemanager.exception.ConflictException;
import com.deadlinemanager.exception.GlobalExceptionHandler;
import com.deadlinemanager.exception.NotFoundException;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.service.DeadlineService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DeadlineController.class)
@Import(GlobalExceptionHandler.class)
class DeadlineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DeadlineService deadlineService;

    @Test
    @DisplayName("GET /api/deadlines/active returns 200 with list")
    void testListActive() throws Exception {
        DeadlineResponse item = new DeadlineResponse(
                1L, "Test", "Short", "Long",
                Instant.now().plus(1, ChronoUnit.DAYS),
                false, Instant.now(), null
        );

        when(deadlineService.listActive()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/deadlines/active"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test"))
                .andExpect(jsonPath("$[0].completed").value(false));
    }

    @Test
    @DisplayName("GET /api/deadlines/completed returns 200 with list")
    void testListCompleted() throws Exception {
        DeadlineResponse item = new DeadlineResponse(
                2L, "Done", null, null,
                Instant.now().minus(1, ChronoUnit.DAYS),
                true, Instant.now().minus(2, ChronoUnit.DAYS),
                Instant.now().minus(1, ChronoUnit.DAYS)
        );

        when(deadlineService.listCompleted()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/deadlines/completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Done"))
                .andExpect(jsonPath("$[0].completed").value(true));
    }

    @Test
    @DisplayName("GET /api/deadlines/{id} returns 404 when not found")
    void testGetNotFound() throws Exception {
        when(deadlineService.getById(99L)).thenThrow(new NotFoundException("Deadline not found: 99"));

        mockMvc.perform(get("/api/deadlines/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Deadline not found: 99"));
    }

    @Test
    @DisplayName("POST /api/deadlines returns 201 with Location header")
    void testCreateSuccess() throws Exception {
        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);
        CreateDeadlineRequest req = new CreateDeadlineRequest("New Task", "Short", "Long", future);

        DeadlineResponse created = new DeadlineResponse(
                5L, "New Task", "Short", "Long",
                future, false, Instant.now(), null
        );

        when(deadlineService.create(any(CreateDeadlineRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/deadlines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith("/api/deadlines/5")))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.title").value("New Task"));
    }

    @Test
    @DisplayName("POST /api/deadlines returns 400 when title is blank")
    void testCreateValidationBlankTitle() throws Exception {
        CreateDeadlineRequest req = new CreateDeadlineRequest("", "Short", "Long", Instant.now().plus(1, ChronoUnit.DAYS));

        mockMvc.perform(post("/api/deadlines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    @Test
    @DisplayName("PATCH /api/deadlines/{id}/due-date updates date")
    void testChangeDueDate() throws Exception {
        Instant newDue = Instant.now().minus(1, ChronoUnit.DAYS); // Past allowed on patch
        ChangeDueDateRequest req = new ChangeDueDateRequest(newDue);

        DeadlineResponse updated = new DeadlineResponse(
                1L, "Task", null, null,
                newDue, false, Instant.now(), null
        );

        when(deadlineService.changeDueDate(eq(1L), any(ChangeDueDateRequest.class))).thenReturn(updated);

        mockMvc.perform(patch("/api/deadlines/1/due-date")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/deadlines/{id}/complete returns 409 on already-completed item")
    void testCompleteConflict() throws Exception {
        when(deadlineService.complete(1L)).thenThrow(new ConflictException("Deadline is already completed"));

        mockMvc.perform(post("/api/deadlines/1/complete"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Deadline is already completed"));
    }

    @Test
    @DisplayName("POST /api/deadlines/{id}/restore returns 409 on already-active item")
    void testRestoreConflict() throws Exception {
        when(deadlineService.restore(1L)).thenThrow(new ConflictException("Deadline is already active"));

        mockMvc.perform(post("/api/deadlines/1/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Deadline is already active"));
    }

    @Test
    @DisplayName("DELETE /api/deadlines/{id} returns 204")
    void testDeleteSuccess() throws Exception {
        doNothing().when(deadlineService).delete(1L);

        mockMvc.perform(delete("/api/deadlines/1"))
                .andExpect(status().isNoContent());
    }
}
