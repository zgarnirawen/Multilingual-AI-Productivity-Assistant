# Productivity API Integration Handoff

## Purpose

This document defines the HTTP contract expected by the Todo and Agenda services used by the assistant's productivity connector layer.

The external Todo and Agenda services are **not implemented in this repository**. This repository provides:

- typed connector interfaces;
- stub implementations for local/offline validation;
- HTTP API implementations for integration with the real services;
- automated HTTP contract checks;
- backend REST routes that expose the connector layer to the assistant/frontend.

The goal is to allow the Todo/Agenda service owner to implement the external APIs independently without requiring changes to the assistant's action-processing logic.

---

## 1. Architecture

The integration has three layers:

```
Assistant intent / confirmation
          |
          v
TodoConnector / AgendaConnector
          |
     +----+----+
     |         |
     v         v
   Stub      HTTP API
  connector  connector
     |         |
     v         v
in-memory   external Todo/Agenda services
```

Connector selection is controlled by:

```env
PRODUCTIVITY_CONNECTOR=stub
```

Use `stub` for local/offline development. Use `api` when the external services are available.

When `PRODUCTIVITY_CONNECTOR=api`, the backend requires:

```env
TODO_API_URL=http://todo-service/
AGENDA_API_URL=http://agenda-service/
PRODUCTIVITY_API_TOKEN=
```

The token is optional in the connector implementation. When provided, it is sent as:

```http
Authorization: Bearer <PRODUCTIVITY_API_TOKEN>
```

No credentials belong in source control.

---

## 2. External Todo API Contract

The `TodoApiConnector` expects the Todo service base URL to expose the following resources.

### List tasks

```http
GET /tasks
Accept: application/json
Authorization: Bearer <token>   # only when configured
```

Expected response:

```json
[
  {
    "id": "task-123",
    "title": "Finish the report",
    "createdAt": "2026-09-26T10:00:00Z",
    "dueDate": "2026-09-28T17:00:00Z",
    "completed": false
  }
]
```

The connector requires `id` and `title`. Other response fields are allowed.

### Get a task

```http
GET /tasks/:id
```

Expected response:

```json
{
  "id": "task-123",
  "title": "Finish the report",
  "createdAt": "2026-09-26T10:00:00Z",
  "completed": false
}
```

If the task does not exist, return:

```http
404 Not Found
```

The connector converts this 404 to `null`.

### Search tasks

```http
GET /tasks?search=invoice
```

The search value must be URL-encoded.

Expected response:

```json
[
  {
    "id": "task-456",
    "title": "Invoice follow-up",
    "completed": false
  }
]
```

The connector expects an array.

### Create a task

```http
POST /tasks
Content-Type: application/json
```

Example request:

```json
{
  "title": "Finish internship report"
}
```

Optional connector-supported field:

```json
{
  "title": "Finish internship report",
  "dueDate": "2026-09-28T17:00:00Z"
}
```

Expected response:

```http
201 Created
Content-Type: application/json
```

```json
{
  "id": "task-789",
  "title": "Finish internship report",
  "dueDate": "2026-09-28T17:00:00Z",
  "completed": false,
  "createdAt": "2026-09-26T10:00:00Z"
}
```

The connector currently sends the complete input object it receives, so the external service may accept additional fields if its API supports them.

### Update a task

```http
PATCH /tasks/:id
Content-Type: application/json
```

Example:

```json
{
  "title": "Finish final internship report"
}
```

Other connector-supported update fields are:

```json
{
  "title": "Finish final internship report",
  "dueDate": "2026-09-29T17:00:00Z",
  "completed": true
}
```

Expected response:

```http
200 OK
```

with the updated task object.

If the task does not exist, return 404. The connector converts that to `null`.

### Delete a task

```http
DELETE /tasks/:id
```

Recommended successful response:

```http
204 No Content
```

A successful non-error response is interpreted as `true`.

If the task does not exist, return 404. The connector converts that to `false`.

---

## 3. External Agenda API Contract

The `AgendaApiConnector` expects the Agenda service base URL to expose the following resources.

### List events

```http
GET /events
```

Expected response:

```json
[
  {
    "id": "event-123",
    "title": "Project meeting",
    "dateTime": "2026-09-27T14:00:00Z",
    "createdAt": "2026-09-26T10:00:00Z",
    "duration": 60
  }
]
```

The connector requires `id`, `title`, and `dateTime`. Additional fields are allowed.

### List events in a date range

The connector supports optional query parameters:

```http
GET /events?startDate=2026-09-25&endDate=2026-09-30
```

The parameters are URL-encoded by the connector.

Expected response:

```json
[
  {
    "id": "event-456",
    "title": "Sprint review",
    "dateTime": "2026-09-27T09:00:00Z"
  }
]
```

The external service is responsible for applying the requested date-range filter.

### Search events

```http
GET /events?search=meeting
```

Expected response:

```json
[
  {
    "id": "event-789",
    "title": "Project meeting",
    "dateTime": "2026-09-27T14:00:00Z"
  }
]
```

### Get an event

```http
GET /events/:id
```

Expected response:

```json
{
  "id": "event-123",
  "title": "Project meeting",
  "dateTime": "2026-09-27T14:00:00Z",
  "duration": 60
}
```

If the event does not exist, return 404. The connector converts this to `null`.

### Create an event

```http
POST /events
Content-Type: application/json
```

Example:

```json
{
  "title": "Meeting with Ali",
  "dateTime": "2026-09-27T14:00:00Z",
  "duration": 90
}
```

Expected response:

```http
201 Created
```

with the created event object.

### Update an event

```http
PATCH /events/:id
Content-Type: application/json
```

Example:

```json
{
  "title": "Updated meeting",
  "dateTime": "2026-09-27T15:00:00Z",
  "duration": 60
}
```

Expected response:

```http
200 OK
```

with the updated event object.

If the event does not exist, return 404. The connector converts this to `null`.

### Delete an event

```http
DELETE /events/:id
```

Recommended successful response:

```http
204 No Content
```

A successful response is interpreted as `true`.

If the event does not exist, return 404. The connector converts that to `false`.

---

## 4. HTTP and Error Contract

The connector treats every non-2xx response as an API error.

For unexpected failures, the connector preserves the upstream status in an error such as:

```text
Todo API 500: ...
Agenda API 500: ...
```

or:

```text
Todo API 401: ...
Agenda API 401: ...
```

Expected 404 behavior is special:

| Operation | External 404 | Connector result |
|---|---|---|
| Get Todo | 404 | `null` |
| Update Todo | 404 | `null` |
| Delete Todo | 404 | `false` |
| Get Event | 404 | `null` |
| Update Event | 404 | `null` |
| Delete Event | 404 | `false` |
| List/Search/Create | 404 | error propagated |

At the backend REST boundary, connector failures are exposed as:

```http
502 Bad Gateway
```

with:

```json
{
  "error": "Todo service unavailable"
}
```

or:

```json
{
  "error": "Agenda service unavailable"
}
```

A missing item is exposed by the backend as 404.

---

## 5. Authentication

Authentication is currently implemented as an optional shared Bearer token.

When configured:

```env
PRODUCTIVITY_API_TOKEN=<secret>
```

every external Todo/Agenda request receives:

```http
Authorization: Bearer <secret>
```

The external services should validate this header according to their authentication policy.

The connector does not implement OAuth, token refresh, user-specific credentials, or service-specific authentication flows.

If the final services use a different authentication mechanism, only the API connector authentication layer should need adjustment; the connector interfaces and assistant action flow can remain unchanged.

---

## 6. Backend API Exposed by This Repository

The backend mounts `productivityRouter` under:

```text
/api/v1
```

Therefore the backend exposes:

### Todo

```http
GET    /api/v1/todos
POST   /api/v1/todos
GET    /api/v1/todos/:id
PATCH  /api/v1/todos/:id
DELETE /api/v1/todos/:id
```

### Agenda

```http
GET    /api/v1/agenda/events
POST   /api/v1/agenda/events
GET    /api/v1/agenda/events/:id
PATCH  /api/v1/agenda/events/:id
DELETE /api/v1/agenda/events/:id
```

These routes call the configured connector. They are **not** the external Todo/Agenda API contract above.

This distinction is important:

```text
Mobile/frontend
      |
      v
This backend
/api/v1/todos
/api/v1/agenda/events
      |
      v
Connector
      |
      v
External service
/tasks
/events
```

---

## 7. Backend REST Validation

The backend productivity routes currently validate required fields for creation.

### Todo

Missing or empty `title`:

```http
POST /api/v1/todos
Content-Type: application/json

{}
```

returns:

```http
400 Bad Request
```

### Agenda

Missing or empty `title` returns 400.

Missing or empty `dateTime` returns 400.

The current route layer does not perform full schema validation of every optional field. The external service remains responsible for validating its own domain-specific fields.

---

## 8. Assistant Action Integration

The assistant uses the connector interfaces rather than calling external APIs directly.

Supported action intents include:

- `create_task`
- `create_event`
- `modify_task`
- `delete_task`
- `modify_event`
- `delete_event`
- `summarize_period`

The confirmation flow executes the corresponding connector operation.

Examples:

```text
create_task  -> todoConnector.createTask(...)
modify_task  -> todoConnector.updateTask(...)
delete_task  -> todoConnector.deleteTask(...)

create_event -> agendaConnector.createEvent(...)
modify_event -> agendaConnector.updateEvent(...)
delete_event -> agendaConnector.deleteEvent(...)
```

This means the assistant action logic is independent of whether the underlying implementation is the stub or the real HTTP service.

---

## 9. Current Natural-Language Mapping

The connector API supports optional Todo `dueDate` and Agenda `duration` fields.

However, the current assistant action mapping does not expose every connector field equally.

For example, task creation currently calls the connector with the extracted task title. Therefore:

```text
Connector capability:
    dueDate supported

Current assistant mapping:
    task title is mapped
    dueDate is not currently wired through confirmation
```

Agenda creation currently passes:

- title;
- event date/time;
- duration when available.

This distinction should be preserved when evaluating the integration.

---

## 10. Environment Configuration

Example configuration:

```env
PRODUCTIVITY_CONNECTOR=stub

TODO_API_URL=http://localhost:4001/
AGENDA_API_URL=http://localhost:4002/
PRODUCTIVITY_API_TOKEN=
```

For the real services:

```env
PRODUCTIVITY_CONNECTOR=api
TODO_API_URL=https://<todo-service-host>/
AGENDA_API_URL=https://<agenda-service-host>/
PRODUCTIVITY_API_TOKEN=<secret>
```

The URLs are environment-specific and are intentionally not hard-coded.

The connector normalizes the configured base URL so a trailing slash is handled consistently.

---

## 11. Local Contract Validation

The repository contains a deterministic local HTTP server used by:

```bash
npm run test:api-connectors
```

This test does not require the real Todo or Agenda services.

It verifies:

- Todo list;
- Todo get;
- Todo search;
- Todo create;
- Todo update;
- Todo delete;
- Agenda list;
- Agenda get;
- Agenda search;
- Agenda date-range filtering;
- Agenda create;
- Agenda update;
- Agenda delete;
- Bearer authentication;
- expected 404 handling;
- propagation of downstream 500 errors.

The connector interface itself is also validated using:

```bash
npm run test:connectors
```

This runs the stub implementations against the shared connector contracts.

---

## 12. Integration Procedure

When the real Todo and Agenda APIs are available:

### Step 1 — Confirm the external endpoints

The service owner should confirm that these routes exist:

```text
Todo:
GET    /tasks
GET    /tasks/:id
GET    /tasks?search=...
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id

Agenda:
GET    /events
GET    /events/:id
GET    /events?search=...
GET    /events?startDate=...&endDate=...
POST   /events
PATCH  /events/:id
DELETE /events/:id
```

### Step 2 — Confirm response shapes

At minimum:

Todo:

```json
{
  "id": "string",
  "title": "string"
}
```

Agenda:

```json
{
  "id": "string",
  "title": "string",
  "dateTime": "ISO-8601 string"
}
```

Additional fields are allowed.

### Step 3 — Confirm authentication

If a shared Bearer token is sufficient:

```env
PRODUCTIVITY_API_TOKEN=<secret>
```

If not, update the API connector authentication mechanism without changing the connector interfaces.

### Step 4 — Configure the backend

Set:

```env
PRODUCTIVITY_CONNECTOR=api
TODO_API_URL=<real Todo base URL>
AGENDA_API_URL=<real Agenda base URL>
PRODUCTIVITY_API_TOKEN=<secret if required>
```

### Step 5 — Run deterministic connector validation

```bash
npm run build
npm run test:connectors
npm run test:api-connectors
```

### Step 6 — Run the assistant E2E suite

Start the backend with the real integration configuration and run:

```bash
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

The E2E suite writes:

```text
backend/test-results/e2e-report.json
```

---

## 13. Responsibilities

### This repository / assistant integration

Responsible for:

- connector interfaces;
- HTTP connector implementations;
- connector selection;
- authentication header handling;
- request construction;
- assistant action routing;
- confirmation flow;
- target lookup through connector search;
- expected 404 mapping;
- propagation of unexpected connector failures;
- deterministic connector validation;
- integration documentation.

### External Todo service

Responsible for:

- implementing the Todo HTTP endpoints;
- persistence of Todo data;
- Todo domain validation;
- authentication/authorization;
- correct HTTP status codes;
- returning the documented JSON representations;
- implementing search semantics;
- implementing update/delete behavior.

### External Agenda service

Responsible for:

- implementing the Agenda HTTP endpoints;
- persistence of event data;
- event domain validation;
- authentication/authorization;
- correct HTTP status codes;
- returning the documented JSON representations;
- implementing search semantics;
- implementing date-range filtering;
- implementing update/delete behavior.

---

## 14. Stub vs Real API Mode

The default mode remains:

```env
PRODUCTIVITY_CONNECTOR=stub
```

This keeps local development and deterministic tests independent of external services.

The real integration is selected with:

```env
PRODUCTIVITY_CONNECTOR=api
```

The assistant should not need separate business logic for the two modes.

The purpose of the connector abstraction is precisely to keep:

```text
Assistant behavior
       independent from
Productivity provider implementation
```

---

## 15. Current Limitations

1. The external Todo and Agenda services are not included in this repository.
2. The HTTP connectors therefore validate the agreed contract against a local test server rather than against the final services.
3. Stub tasks currently do not have due dates, so task date-range summaries are not equivalent to a real task service with due dates.
4. The current assistant task creation flow does not yet map `dueDate` from natural language into the connector confirmation payload.
5. Authentication currently assumes an optional Bearer token; a different production authentication scheme would require connector-level changes.
6. The E2E suite is environment-dependent because it requires a running backend and runtime AI configuration.
7. Voice E2E is not covered by the 20 HTTP scenarios; the transcription endpoint requires an actual audio fixture and transcription provider.
8. External API performance and availability are not established by the local mock-server connector checks.

---

## 16. Delivery Status

```text
Connector interfaces              COMPLETE
Stub implementations              COMPLETE
HTTP API connectors               COMPLETE
Assistant integration             COMPLETE
Backend productivity routes       COMPLETE
HTTP contract validation          COMPLETE
Connector contract validation     COMPLETE
Documentation handoff             COMPLETE

Real external service integration BLOCKED ONLY BY AVAILABILITY
                                   OF THE FINAL SERVICES/API DETAILS
```

The integration is therefore ready for the external Todo/Agenda service owner to implement against this contract.

Once the real endpoints are available, integration should primarily consist of environment configuration and validation rather than redesigning the assistant action layer.
