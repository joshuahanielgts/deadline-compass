package com.deadlinemanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * JPA entity mapping to the 'deadlines' table.
 *
 * <p>All timestamp fields use java.time.Instant so they are stored and retrieved as UTC
 * regardless of the JVM's default timezone. The DB schema enforces that completed_at
 * is set if and only if completed = true (see: chk_completed_sync constraint).
 *
 * <p>No Lombok — all getters and setters are written explicitly per AGENTS.md §11.
 */
@Entity
@Table(name = "deadlines")
public class Deadline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "long_description")
    private String longDescription;

    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Null when active, non-null when completed — kept in sync by the service layer
    // and enforced at the DB level by the chk_completed_sync constraint.
    @Column(name = "completed_at")
    private Instant completedAt;

    // ---- Getters ----

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getShortDescription() { return shortDescription; }
    public String getLongDescription() { return longDescription; }
    public Instant getDueAt() { return dueAt; }
    public boolean isCompleted() { return completed; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }

    // ---- Setters ----

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public void setLongDescription(String longDescription) { this.longDescription = longDescription; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
