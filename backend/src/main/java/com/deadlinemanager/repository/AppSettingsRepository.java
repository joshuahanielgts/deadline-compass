package com.deadlinemanager.repository;

import com.deadlinemanager.model.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for the singleton app_settings row.
 *
 * The settings row (id = 1) is inserted by V1 migration and always exists.
 * We use findById(1) to read it and save() to update it.
 */
public interface AppSettingsRepository extends JpaRepository<AppSettings, Short> {
}
