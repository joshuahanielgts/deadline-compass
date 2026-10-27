package com.deadlinemanager.service;

import com.deadlinemanager.dto.ChangeDueDateRequest;
import com.deadlinemanager.dto.CreateDeadlineRequest;
import com.deadlinemanager.dto.DeadlineResponse;
import com.deadlinemanager.exception.ConflictException;
import com.deadlinemanager.exception.NotFoundException;
import com.deadlinemanager.exception.ValidationException;
import com.deadlinemanager.model.Deadline;
import com.deadlinemanager.repository.DeadlineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Business logic for deadline operations.
 *
 * <p>Business rules enforced here (per AGENTS.md §4 and §8):
 * - Create: dueAt must be strictly in the future (server-side, not just frontend).
 * - Change due date: past dates allowed (deadline shows as overdue).
 * - Complete: only active (non-completed) deadlines can be completed; sets completedAt = now().
 * - Restore: only completed deadlines can be restored; clears completedAt.
 * - Delete: any deadline can be deleted regardless of state.
 *
 * <p>Urgency colour is derived at render time by the frontend — never stored here.
 */
@Service
public class DeadlineService {

    private final DeadlineRepository deadlineRepository;

    public DeadlineService(DeadlineRepository deadlineRepository) {
        this.deadlineRepository = deadlineRepository;
    }

    /** Returns all active deadlines sorted by dueAt ascending. */
    @Transactional(readOnly = true)
    public List<DeadlineResponse> listActive() {
        return deadlineRepository.findByCompletedFalseOrderByDueAtAsc()
                .stream()
                .map(DeadlineResponse::from)
                .toList();
    }

    /** Returns all completed deadlines sorted by completedAt descending (most recent first). */
    @Transactional(readOnly = true)
    public List<DeadlineResponse> listCompleted() {
        return deadlineRepository.findByCompletedTrueOrderByCompletedAtDesc()
                .stream()
                .map(DeadlineResponse::from)
                .toList();
    }

    /** Returns a single deadline by id. Throws NotFoundException if it doesn't exist. */
    @Transactional(readOnly = true)
    public DeadlineResponse getById(Long id) {
        return DeadlineResponse.from(findOrThrow(id));
    }

    /**
     * Creates a new active deadline.
     *
     * <p>Rule: dueAt must be strictly in the future. If not, throws ValidationException
     * with fieldErrors.dueAt so the frontend can show it inline.
     */
    @Transactional
    public DeadlineResponse create(CreateDeadlineRequest req) {
        // Server-side enforcement: due date must be in the future (AGENTS.md §4 rule 2).
        if (!req.dueAt().isAfter(Instant.now())) {
            throw new ValidationException("dueAt", "Due date must be in the future.");
        }

        Instant now = Instant.now();
        Deadline d = new Deadline();
        d.setTitle(req.title().strip());
        d.setShortDescription(req.shortDescription() != null ? req.shortDescription().strip() : null);
        d.setLongDescription(req.longDescription() != null ? req.longDescription().strip() : null);
        d.setDueAt(req.dueAt());
        d.setCompleted(false);
        d.setCreatedAt(now);
        d.setUpdatedAt(now);
        // completedAt stays null — deadline is active.

        return DeadlineResponse.from(deadlineRepository.save(d));
    }

    /**
     * Changes the due date of an existing deadline.
     *
     * <p>Rule: past dates ARE allowed (shows as overdue). This is different from create.
     */
    @Transactional
    public DeadlineResponse changeDueDate(Long id, ChangeDueDateRequest req) {
        Deadline d = findOrThrow(id);
        d.setDueAt(req.dueAt());
        d.setUpdatedAt(Instant.now());
        return DeadlineResponse.from(deadlineRepository.save(d));
    }

    /**
     * Marks a deadline as completed. Sets completedAt to the current instant.
     *
     * <p>Rule: completing an already-completed deadline is a 409 conflict — the DB constraint
     * (chk_completed_sync) would also prevent it, but we check in code first for a clear message.
     */
    @Transactional
    public DeadlineResponse complete(Long id) {
        Deadline d = findOrThrow(id);
        if (d.isCompleted()) {
            throw new ConflictException("Deadline " + id + " is already completed.");
        }
        Instant now = Instant.now();
        d.setCompleted(true);
        d.setCompletedAt(now);
        d.setUpdatedAt(now);
        return DeadlineResponse.from(deadlineRepository.save(d));
    }

    /**
     * Restores a completed deadline back to the active list. Clears completedAt.
     *
     * <p>Rule: restoring an already-active deadline is a 409 conflict.
     */
    @Transactional
    public DeadlineResponse restore(Long id) {
        Deadline d = findOrThrow(id);
        if (!d.isCompleted()) {
            throw new ConflictException("Deadline " + id + " is not completed and cannot be restored.");
        }
        d.setCompleted(false);
        d.setCompletedAt(null);
        d.setUpdatedAt(Instant.now());
        return DeadlineResponse.from(deadlineRepository.save(d));
    }

    /**
     * Permanently deletes a deadline. Throws NotFoundException if it doesn't exist.
     */
    @Transactional
    public void delete(Long id) {
        Deadline d = findOrThrow(id);
        deadlineRepository.delete(d);
    }

    // ---- Private helpers ----

    private Deadline findOrThrow(Long id) {
        return deadlineRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Deadline not found: " + id));
    }
}
