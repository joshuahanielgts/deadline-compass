# Deadline Compass — Personal Deadline Manager

A single-user, local-first Deadline Manager designed for focused deadline tracking with live countdowns, dynamic urgency color rails, custom threshold settings, and history tracking.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler & Dev Server:** Vite 8 (with `@lovable.dev/vite-tanstack-config`)
- **Styling & UI:** Tailwind CSS, shadcn/ui (Radix UI primitives)
- **Icons & Dates:** Lucide React, `date-fns`
- **Notifications:** Sonner
- **Testing:** Vitest, `@testing-library/react`, `jsdom`

### Backend
- **Language & Runtime:** Java 21 / 23
- **Framework:** Spring Boot 3.4.5 (Spring Web, Spring Data JPA, Bean Validation)
- **Database Migrations:** Flyway 10 (PostgreSQL engine)
- **Connection Pool:** HikariCP (configured with maximum 5 connections)
- **Build Tool:** Apache Maven 3.9+
- **Testing:** JUnit 5, Mockito, Spring MockMvc

### Database
- **Provider:** Supabase-hosted PostgreSQL 17
- **Security:** Row Level Security (RLS) enabled on all tables with zero public access; privileges revoked from `anon` and `authenticated` roles.
- **Access Model:** Direct JDBC / Session Pooler from the Spring Boot backend only; frontend never connects to Supabase directly.

---

## Key Features

1. **Active Deadlines Board:**
   - Visual cards sorted by `dueAt ASC` (soonest first).
   - Left color rail derived dynamically at render time (`Red`, `Yellow`, `Green`, or `Overdue`).
   - Live countdown timer calculating real-time remaining / overdue intervals.
   - Read-only detail dialog showcasing full descriptions.

2. **Strict Urgency Logic (Render-Time Derived):**
   - **Overdue:** `remaining <= 0` (Red styling, negative countdown text).
   - **Urgent (Red):** `remaining <= redThresholdHours` (default: ≤ 24 hours).
   - **Due Soon (Yellow):** `remaining <= yellowThresholdHours` (default: ≤ 72 hours).
   - **On Track (Green):** `remaining > yellowThresholdHours`.

3. **Custom Urgency Settings:**
   - Configure red and yellow threshold hours directly from the UI.
   - Cross-field validation enforcing `0 < red < yellow <= 8760` (1 year maximum).

4. **Previous Deadlines (History):**
   - Explicit completion tracking (overdue items remain active until explicitly marked complete).
   - Sorted by `completedAt DESC`.
   - Restore to active list or permanently delete with confirmation dialogs.

5. **Security & Data Isolation:**
   - No mock data or fake seeded data in production mode.
   - Zero credentials in source code (loaded via gitignored `backend/.env`).
   - Supabase tables protected by Row Level Security (RLS).
   - Strict CORS policy matching backend and frontend origins (no wildcards).

---

## Architecture Overview

```
                                +---------------------------+
                                |  React Frontend (Vite)   |
                                |  http://localhost:3000   |
                                +-------------+-------------+
                                              |
                                              | JSON REST API
                                              v
                                +---------------------------+
                                | Spring Boot 3.x Backend   |
                                |  http://localhost:8081   |
                                +-------------+-------------+
                                              |
                                              | JDBC (SSL / RLS)
                                              v
                                +---------------------------+
                                | Supabase PostgreSQL 17   |
                                | (deadlines, app_settings) |
                                +---------------------------+
```

---

## Project Structure

```
deadline-compass/
├── AGENTS.md                  # Specification and locked architecture rules
├── README.md                  # Project overview and documentation
├── howtorun.md                # Terminal commands and execution guide
├── package.json               # Frontend dependencies and scripts
├── vite.config.ts             # Vite server and build configuration
├── docs/
│   ├── API.md                 # Full REST API specification
│   └── api.http               # REST Client file for HTTP endpoint testing
├── backend/
│   ├── pom.xml                # Maven build definition
│   ├── .env.example           # Environment template (gitignored .env)
│   ├── .gitignore             # Ignores .env and build target artifacts
│   └── src/
│       ├── main/
│       │   ├── java/com/deadlinemanager/
│       │   │   ├── DeadlineManagerApplication.java
│       │   │   ├── config/WebConfig.java (CORS policy)
│       │   │   ├── controller/{DeadlineController, SettingsController}.java
│       │   │   ├── service/{DeadlineService, SettingsService}.java
│       │   │   ├── repository/{DeadlineRepository, AppSettingsRepository}.java
│       │   │   ├── model/{Deadline, AppSettings}.java
│       │   │   ├── dto/{DeadlineResponse, CreateDeadlineRequest, ...}.java
│       │   │   └── exception/GlobalExceptionHandler.java
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/V1__create_schema.sql
│       └── test/java/com/deadlinemanager/
│           ├── controller/{DeadlineControllerTest, SettingsControllerTest}.java
│           └── service/{DeadlineServiceTest, SettingsServiceTest}.java
└── src/                       # Frontend source
    ├── components/            # UI components (AppSidebar, DeadlineCard, Dialogs)
    ├── hooks/                 # Custom React hooks
    ├── lib/                   # API client (api.ts), types (types.ts), countdown (time.ts)
    ├── pages/                 # ListDeadlines, DeadlineSettings, PreviousDeadlines
    └── test/                  # Frontend Vitest test suites
```

---

## Quick Start

See [howtorun.md](file:///c:/Users/Joshua/Downloads/deadline-compass-main/deadline-compass-main/howtorun.md) for step-by-step commands.

### 1. Backend:
```powershell
cd backend
mvn spring-boot:run
```

### 2. Frontend:
```powershell
npm install --legacy-peer-deps
npm run dev
```

### 3. Verification:
- **Backend Tests:** `cd backend && mvn test` (30 tests passing)
- **Frontend Tests:** `npm test` (11 tests passing)
- **Frontend Build:** `npm run build` (Clean production bundle)
