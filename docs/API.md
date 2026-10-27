# Deadline Manager — API Documentation

Base URL: `http://localhost:8081`

All timestamps are ISO-8601 UTC strings (`YYYY-MM-DDTHH:mm:ssZ`).

---

## Error Response Format

All error responses (4xx, 5xx) follow this standard structure:

```json
{
  "timestamp": "2026-10-26T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": {
    "title": "Title is required and must be between 1 and 150 characters"
  }
}
```

- `fieldErrors` is present on field validation errors (or null/empty otherwise).
- Stack traces and raw SQL are never leaked.

---

## Endpoints

### 1. List Active Deadlines
- **Method:** `GET`
- **Path:** `/api/deadlines/active`
- **Description:** Returns all uncompleted deadlines sorted by `dueAt ASC`.
- **Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Submit Tax Return",
    "shortDescription": "2025 filing",
    "longDescription": "Remember to include all schedules and deduction receipts.",
    "dueAt": "2026-11-01T17:00:00Z",
    "completed": false,
    "createdAt": "2026-10-26T10:00:00Z",
    "completedAt": null
  }
]
```

---

### 2. List Completed Deadlines
- **Method:** `GET`
- **Path:** `/api/deadlines/completed`
- **Description:** Returns all completed deadlines sorted by `completedAt DESC`.
- **Response:** `200 OK`
```json
[
  {
    "id": 2,
    "title": "Quarterly Review",
    "shortDescription": "Q3 review",
    "longDescription": null,
    "dueAt": "2026-10-20T12:00:00Z",
    "completed": true,
    "createdAt": "2026-10-15T09:00:00Z",
    "completedAt": "2026-10-20T11:45:00Z"
  }
]
```

---

### 3. Get Single Deadline
- **Method:** `GET`
- **Path:** `/api/deadlines/{id}`
- **Description:** Returns detail of a single deadline by ID.
- **Response:** `200 OK` or `404 Not Found`
```json
{
  "id": 1,
  "title": "Submit Tax Return",
  "shortDescription": "2025 filing",
  "longDescription": "Remember to include all schedules and deduction receipts.",
  "dueAt": "2026-11-01T17:00:00Z",
  "completed": false,
  "createdAt": "2026-10-26T10:00:00Z",
  "completedAt": null
}
```

---

### 4. Create Deadline
- **Method:** `POST`
- **Path:** `/api/deadlines`
- **Header:** `Content-Type: application/json`
- **Rules:**
  - `title`: required, 1–150 characters
  - `shortDescription`: optional, max 200 characters
  - `longDescription`: optional, max 5000 characters
  - `dueAt`: required ISO-8601 UTC string, **must be in the future**
- **Request Body:**
```json
{
  "title": "Complete Project Proposal",
  "shortDescription": "Final draft for review",
  "longDescription": "Review sections 1-4 with team lead.",
  "dueAt": "2026-11-15T18:00:00Z"
}
```
- **Response:** `201 Created`
  - Header: `Location: /api/deadlines/{id}`
  - Body: Created Deadline object

---

### 5. Change Deadline Due Date
- **Method:** `PATCH`
- **Path:** `/api/deadlines/{id}/due-date`
- **Header:** `Content-Type: application/json`
- **Rules:**
  - `dueAt`: required ISO-8601 UTC string. **Past dates are permitted**.
- **Request Body:**
```json
{
  "dueAt": "2026-11-20T18:00:00Z"
}
```
- **Response:** `200 OK`
  - Body: Updated Deadline object

---

### 6. Mark Deadline as Complete
- **Method:** `POST`
- **Path:** `/api/deadlines/{id}/complete`
- **Description:** Marks an active deadline as completed (`completed = true`, `completedAt = current instant`).
- **Response:**
  - `200 OK`: Updated Deadline object
  - `409 Conflict`: If deadline is already completed
  - `404 Not Found`: If deadline ID does not exist

---

### 7. Restore Deadline to Active
- **Method:** `POST`
- **Path:** `/api/deadlines/{id}/restore`
- **Description:** Restores a completed deadline to active status (`completed = false`, `completedAt = null`).
- **Response:**
  - `200 OK`: Updated Deadline object
  - `409 Conflict`: If deadline is already active
  - `404 Not Found`: If deadline ID does not exist

---

### 8. Delete Deadline
- **Method:** `DELETE`
- **Path:** `/api/deadlines/{id}`
- **Description:** Permanently deletes a deadline.
- **Response:** `204 No Content`
  - `404 Not Found`: If deadline ID does not exist

---

### 9. Get Urgency Settings
- **Method:** `GET`
- **Path:** `/api/settings`
- **Description:** Retrieves current urgency thresholds (in hours).
- **Response:** `200 OK`
```json
{
  "redThresholdHours": 24,
  "yellowThresholdHours": 72
}
```

---

### 10. Update Urgency Settings
- **Method:** `PUT`
- **Path:** `/api/settings`
- **Header:** `Content-Type: application/json`
- **Rules:**
  - `redThresholdHours`: integer, `> 0`
  - `yellowThresholdHours`: integer, `> redThresholdHours` and `<= 8760`
- **Request Body:**
```json
{
  "redThresholdHours": 48,
  "yellowThresholdHours": 96
}
```
- **Response:** `200 OK`
  - Body: Updated Settings object
  - `400 Bad Request`: If thresholds violate `0 < red < yellow <= 8760`
