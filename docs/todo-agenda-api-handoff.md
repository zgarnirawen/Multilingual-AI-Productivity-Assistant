# Todo & Agenda API Integration Handoff

## Purpose

This document is the implementation handoff for the engineer owning the external Todo and Agenda services.

The assistant-side integration is already implemented in PR #15. The external services only need to expose the HTTP contract below. No changes to the assistant intent, confirmation, or connector architecture are required to satisfy the contract.

## 1. Todo API

Base URL is configured with `TODO_API_URL`.

| Method | Endpoint | Success | Missing resource |
|---|---|---|---|
| GET | `/tasks` | 200 + `Todo[]` | — |
| GET | `/tasks/:id` | 200 + `Todo` | 404 |
| GET | `/tasks?search=...` | 200 + `Todo[]` | — |
| POST | `/tasks` | 201 + `Todo` | — |
| PATCH | `/tasks/:id` | 200 + `Todo` | 404 |
| DELETE | `/tasks/:id` | 204 | 404 |

Minimum Todo response shape:

```json
{
  "id": "task-123",
  "title": "Finish report"
}
```

Optional fields supported by the connector include `createdAt`, `dueDate`, and `completed`.

Create example:

```json
{
  "title": "Finish report",
  "dueDate": "2026-09-28T17:00:00Z"
}
```

Update accepts optional `title`, `dueDate`, and `completed`.

## 2. Agenda API

Base URL is configured with `AGENDA_API_URL`.

| Method | Endpoint | Success | Missing resource |
|---|---|---|---|
| GET | `/events` | 200 + `AgendaEvent[]` | — |
| GET | `/events/:id` | 200 + `AgendaEvent` | 404 |
| GET | `/events?search=...` | 200 + `AgendaEvent[]` | — |
| GET | `/events?startDate=...&endDate=...` | 200 + `AgendaEvent[]` | — |
| POST | `/events` | 201 + `AgendaEvent` | — |
| PATCH | `/events/:id` | 200 + `AgendaEvent` | 404 |
| DELETE | `/events/:id` | 204 | 404 |

Minimum event response shape:

```json
{
  "id": "event-123",
  "title": "Project meeting",
  "dateTime": "2026-09-27T14:00:00Z"
}
```

Optional fields include `createdAt` and `duration`.

Create example:

```json
{
  "title": "Meeting with Ali",
  "dateTime": "2026-09-27T14:00:00Z",
  "duration": 90
}
```

The external service is responsible for applying `startDate` / `endDate` filtering.

## 3. Authentication

If the service uses the shared token mechanism, configure:

```env
PRODUCTIVITY_API_TOKEN=<secret>
```

The connector sends:

```http
Authorization: Bearer <PRODUCTIVITY_API_TOKEN>
```

Do not commit credentials.

If a different authentication mechanism is required, the connector authentication layer can be adapted without changing the Todo/Agenda interfaces or assistant action flow.

## 4. Error semantics

Every non-2xx response is treated as an API error.

For get/update/delete operations, an external 404 is mapped by the connector to:

- get → `null`
- update → `null`
- delete → `false`

A 404 from list/search/create is propagated as an upstream error.

Unexpected upstream failures such as 500 are also propagated. The backend exposes connector failures as HTTP 502.

## 5. Configuration

Set the following when the real services are available:

```env
PRODUCTIVITY_CONNECTOR=api
TODO_API_URL=https://<todo-service>/
AGENDA_API_URL=https://<agenda-service>/
PRODUCTIVITY_API_TOKEN=<secret-if-required>
```

Keep `PRODUCTIVITY_CONNECTOR=stub` for local/offline development.

## 6. What is already implemented

The assistant repository already contains:

- typed `TodoConnector` and `AgendaConnector` interfaces;
- HTTP Todo and Agenda connector implementations;
- stub implementations;
- Bearer-token support;
- CRUD operations;
- search support;
- Agenda date-range query construction;
- 404 handling;
- downstream error propagation;
- assistant action routing through the connectors;
- backend productivity REST routes;
- deterministic connector contract tests;
- detailed documentation in `docs/productivity-api-integration.md`.

Relevant implementation paths:

```text
backend/src/connectors/todo/
backend/src/connectors/agenda/
backend/src/connectors/index.ts
backend/src/routes/productivity.ts
docs/productivity-api-integration.md
```

## 7. Validation after the services are available

First configure the real URLs/token, then run:

```bash
npm run build
npm run test:connectors
npm run test:api-connectors
```

The local API connector test uses a deterministic mock server and does not replace validation against the real services.

Then run the assistant E2E suite against the configured backend.

## 8. Responsibility split

### Assistant repository

Owns the connector/client layer, assistant action flow, confirmation flow, error mapping, and integration validation.

### Todo service

Owns the `/tasks` endpoints, persistence, domain validation, authentication/authorization, search semantics, and Todo HTTP responses.

### Agenda service

Owns the `/events` endpoints, persistence, domain validation, authentication/authorization, search semantics, date-range filtering, and Agenda HTTP responses.

The external services should implement the contract above rather than requiring changes to the assistant action-processing logic.
