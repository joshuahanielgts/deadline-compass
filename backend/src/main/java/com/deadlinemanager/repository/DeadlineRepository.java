package com.deadlinemanager.repository;

import com.deadlinemanager.model.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository for deadline persistence.
 *
 * Spring Data generates the SQL from the method names. The two list methods
 * match the indexes created in V1__create_schema.sql for performance.
 */
public interface DeadlineRepository extends JpaRepository<Deadline, Long> {

    /**
     * Returns all active (non-completed) deadlines, sorted by due date ascending.
     * Matches the index: idx_deadlines_active_due.
     */
    List<Deadline> findByCompletedFalseOrderByDueAtAsc();

    /**
     * Returns all completed deadlines, sorted by completion date descending
     * (most recently completed first). Matches the index: idx_deadlines_completed_at.
     */
    List<Deadline> findByCompletedTrueOrderByCompletedAtDesc();
}
