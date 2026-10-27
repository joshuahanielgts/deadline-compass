package com.deadlinemanager.controller;

import com.deadlinemanager.dto.ChangeDueDateRequest;
import com.deadlinemanager.dto.CreateDeadlineRequest;
import com.deadlinemanager.dto.DeadlineResponse;
import com.deadlinemanager.service.DeadlineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * REST controller for deadline CRUD operations.
 *
 * <p>Paths match AGENTS.md §8 exactly. Controllers are thin:
 * all business rules live in DeadlineService.
 *
 * <p>Controllers return DTO records, never JPA entities.
 */
@RestController
@RequestMapping("/api/deadlines")
public class DeadlineController {

    private final DeadlineService deadlineService;

    public DeadlineController(DeadlineService deadlineService) {
        this.deadlineService = deadlineService;
    }

    /** GET /api/deadlines/active — returns active deadlines sorted by dueAt ASC */
    @GetMapping("/active")
    public List<DeadlineResponse> listActive() {
        return deadlineService.listActive();
    }

    /** GET /api/deadlines/completed — returns completed deadlines sorted by completedAt DESC */
    @GetMapping("/completed")
    public List<DeadlineResponse> listCompleted() {
        return deadlineService.listCompleted();
    }

    /** GET /api/deadlines/{id} — returns a single deadline by id */
    @GetMapping("/{id}")
    public DeadlineResponse getById(@PathVariable Long id) {
        return deadlineService.getById(id);
    }

    /**
     * POST /api/deadlines — creates a new deadline.
     *
     * <p>Returns 201 Created with a Location header pointing to the new resource.
     */
    @PostMapping
    public ResponseEntity<DeadlineResponse> create(@Valid @RequestBody CreateDeadlineRequest req) {
        DeadlineResponse created = deadlineService.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** PATCH /api/deadlines/{id}/due-date — changes the due date; past dates allowed */
    @PatchMapping("/{id}/due-date")
    public DeadlineResponse changeDueDate(
            @PathVariable Long id,
            @Valid @RequestBody ChangeDueDateRequest req) {
        return deadlineService.changeDueDate(id, req);
    }

    /** POST /api/deadlines/{id}/complete — marks deadline as completed */
    @PostMapping("/{id}/complete")
    public DeadlineResponse complete(@PathVariable Long id) {
        return deadlineService.complete(id);
    }

    /** POST /api/deadlines/{id}/restore — restores a completed deadline to active */
    @PostMapping("/{id}/restore")
    public DeadlineResponse restore(@PathVariable Long id) {
        return deadlineService.restore(id);
    }

    /**
     * DELETE /api/deadlines/{id} — permanently deletes a deadline.
     *
     * <p>Returns 204 No Content on success (no body).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deadlineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
