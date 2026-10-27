package com.deadlinemanager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * JPA entity mapping to the 'app_settings' table.
 *
 * <p>This is a singleton row: id is always 1 (enforced by a DB CHECK constraint).
 * The urgency thresholds are total hours (not hour+day splits) — the frontend
 * does the presentation split. Validation: 0 < red < yellow <= 8760.
 *
 * <p>No Lombok — all getters and setters are written explicitly per AGENTS.md §11.
 */
@Entity
@Table(name = "app_settings")
public class AppSettings {

    // Always 1 — enforced by DB CHECK (id = 1). We never generate this; it's pre-inserted.
    @Id
    private Short id;

    // Hours before due at which a deadline turns red. Must satisfy 0 < red < yellow.
    @Column(name = "red_threshold_hours", nullable = false)
    private int redThresholdHours;

    // Hours before due at which a deadline turns yellow. Must satisfy red < yellow <= 8760.
    @Column(name = "yellow_threshold_hours", nullable = false)
    private int yellowThresholdHours;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ---- Getters ----

    public Short getId() { return id; }
    public int getRedThresholdHours() { return redThresholdHours; }
    public int getYellowThresholdHours() { return yellowThresholdHours; }
    public Instant getUpdatedAt() { return updatedAt; }

    // ---- Setters ----

    public void setId(Short id) { this.id = id; }
    public void setRedThresholdHours(int redThresholdHours) { this.redThresholdHours = redThresholdHours; }
    public void setYellowThresholdHours(int yellowThresholdHours) { this.yellowThresholdHours = yellowThresholdHours; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
