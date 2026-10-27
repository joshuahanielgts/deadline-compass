package com.deadlinemanager.service;

import com.deadlinemanager.dto.ChangeDueDateRequest;
import com.deadlinemanager.dto.CreateDeadlineRequest;
import com.deadlinemanager.dto.DeadlineResponse;
import com.deadlinemanager.exception.ConflictException;
import com.deadlinemanager.exception.NotFoundException;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.model.Deadline;
import com.deadlinemanager.repository.DeadlineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeadlineServiceTest {

    @Mock
    private DeadlineRepository deadlineRepository;

    private DeadlineService deadlineService;

    @BeforeEach
    void setUp() {
        deadlineService = new DeadlineService(deadlineRepository);
    }

    @Test
    @DisplayName("listActive returns deadlines sorted by dueAt ASC")
    void testListActive() {
        Deadline d1 = new Deadline();
        d1.setId(1L);
        d1.setTitle("Due sooner");
        d1.setDueAt(Instant.now().plus(1, ChronoUnit.DAYS));
        d1.setCompleted(false);

        when(deadlineRepository.findByCompletedFalseOrderByDueAtAsc()).thenReturn(List.of(d1));

        List<DeadlineResponse> responses = deadlineService.listActive();
        assertEquals(1, responses.size());
        assertEquals("Due sooner", responses.get(0).title());
        assertFalse(responses.get(0).completed());
    }

    @Test
    @DisplayName("listCompleted returns deadlines sorted by completedAt DESC")
    void testListCompleted() {
        Deadline d1 = new Deadline();
        d1.setId(2L);
        d1.setTitle("Finished");
        d1.setDueAt(Instant.now().minus(2, ChronoUnit.DAYS));
        d1.setCompleted(true);
        d1.setCompletedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        when(deadlineRepository.findByCompletedTrueOrderByCompletedAtDesc()).thenReturn(List.of(d1));

        List<DeadlineResponse> responses = deadlineService.listCompleted();
        assertEquals(1, responses.size());
        assertEquals("Finished", responses.get(0).title());
        assertTrue(responses.get(0).completed());
        assertNotNull(responses.get(0).completedAt());
    }

    @Test
    @DisplayName("getById throws NotFoundException when deadline does not exist")
    void testGetByIdNotFound() {
        when(deadlineRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> deadlineService.getById(999L));
    }

    @Test
    @DisplayName("create rejects due date in the past")
    void testCreatePastDueDateFails() {
        CreateDeadlineRequest request = new CreateDeadlineRequest(
                "Past Task",
                "Short",
                "Long",
                Instant.now().minus(1, ChronoUnit.HOURS)
        );

        ValidationException ex = assertThrows(ValidationException.class, () -> deadlineService.create(request));
        assertTrue(ex.getFieldErrors().containsKey("dueAt"));
    }

    @Test
    @DisplayName("create succeeds with future due date")
    void testCreateFutureDueDateSucceeds() {
        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);
        CreateDeadlineRequest request = new CreateDeadlineRequest("Future Task", "Short", "Long", future);

        when(deadlineRepository.save(any(Deadline.class))).thenAnswer(invocation -> {
            Deadline d = invocation.getArgument(0);
            d.setId(10L);
            d.setCreatedAt(Instant.now());
            return d;
        });

        DeadlineResponse resp = deadlineService.create(request);
        assertNotNull(resp);
        assertEquals("Future Task", resp.title());
        assertEquals(10L, resp.id());
        assertFalse(resp.completed());
        assertNull(resp.completedAt());
    }

    @Test
    @DisplayName("changeDueDate allows changing to past date")
    void testChangeDueDateAllowsPast() {
        Deadline d = new Deadline();
        d.setId(1L);
        d.setTitle("Task");
        d.setDueAt(Instant.now().plus(1, ChronoUnit.DAYS));
        d.setCompleted(false);

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));
        when(deadlineRepository.save(any(Deadline.class))).thenAnswer(i -> i.getArgument(0));

        Instant past = Instant.now().minus(1, ChronoUnit.DAYS);
        ChangeDueDateRequest req = new ChangeDueDateRequest(past);

        DeadlineResponse resp = deadlineService.changeDueDate(1L, req);
        assertEquals(past, resp.dueAt());
    }

    @Test
    @DisplayName("complete marks active deadline as completed")
    void testCompleteActiveDeadline() {
        Deadline d = new Deadline();
        d.setId(1L);
        d.setTitle("Task");
        d.setDueAt(Instant.now().plus(1, ChronoUnit.DAYS));
        d.setCompleted(false);

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));
        when(deadlineRepository.save(any(Deadline.class))).thenAnswer(i -> i.getArgument(0));

        DeadlineResponse resp = deadlineService.complete(1L);
        assertTrue(resp.completed());
        assertNotNull(resp.completedAt());
    }

    @Test
    @DisplayName("complete throws ConflictException if deadline is already completed")
    void testCompleteAlreadyCompletedFails() {
        Deadline d = new Deadline();
        d.setId(1L);
        d.setTitle("Task");
        d.setDueAt(Instant.now().plus(1, ChronoUnit.DAYS));
        d.setCompleted(true);
        d.setCompletedAt(Instant.now());

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));

        assertThrows(ConflictException.class, () -> deadlineService.complete(1L));
    }

    @Test
    @DisplayName("restore marks completed deadline as active")
    void testRestoreCompletedDeadline() {
        Deadline d = new Deadline();
        d.setId(1L);
        d.setTitle("Task");
        d.setDueAt(Instant.now().minus(1, ChronoUnit.DAYS));
        d.setCompleted(true);
        d.setCompletedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));
        when(deadlineRepository.save(any(Deadline.class))).thenAnswer(i -> i.getArgument(0));

        DeadlineResponse resp = deadlineService.restore(1L);
        assertFalse(resp.completed());
        assertNull(resp.completedAt());
    }

    @Test
    @DisplayName("restore throws ConflictException if deadline is already active")
    void testRestoreAlreadyActiveFails() {
        Deadline d = new Deadline();
        d.setId(1L);
        d.setTitle("Task");
        d.setDueAt(Instant.now().plus(1, ChronoUnit.DAYS));
        d.setCompleted(false);

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));

        assertThrows(ConflictException.class, () -> deadlineService.restore(1L));
    }

    @Test
    @DisplayName("delete permanently removes deadline")
    void testDeleteSuccess() {
        Deadline d = new Deadline();
        d.setId(1L);

        when(deadlineRepository.findById(1L)).thenReturn(Optional.of(d));

        deadlineService.delete(1L);
        verify(deadlineRepository).delete(d);
    }
}
