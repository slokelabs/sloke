# HTTP API

> Draft spec for the sloke daemon. Endpoints marked 🚧 may change before the first release.

Base URL: `http://localhost:3939` (configurable)

Auth: `Authorization: Bearer <token>` (token set in config; `sloke init` generates one)

## Tasks

### `POST /api/tasks` — create a task

```json
{
  "type": "bt",
  "source": "magnet:?xt=urn:btih:...",
  "target": { "library": "books", "category": "comics" },
  "options": {}
}
```

Returns the created task. The daemon routes it to an adapter and executes it.

### `GET /api/tasks/:id` — get a task

```json
{
  "id": "...",
  "type": "bt",
  "source": "...",
  "target": { "library": "books", "category": "comics" },
  "status": "running",
  "createdAt": 1750000000000,
  "updatedAt": 1750000010000,
  "error": null
}
```

### `GET /api/tasks?status=running&limit=50` — list tasks

### `DELETE /api/tasks/:id` — cancel a queued/running task 🚧

## Adapters

### `GET /api/adapters` — list registered adapters

```json
{
  "adapters": [
    { "id": "qbt", "supportedTypes": ["bt"] },
    { "id": "direct", "supportedTypes": ["direct"] }
  ]
}
```

## Health

### `GET /healthz` — liveness

Returns `200 {"status":"ok"}` when the daemon is up.

## Webhooks (outbound)

The daemon emits task events to configured webhook URLs:

```json
{
  "event": "task.completed",
  "task": { "id": "...", "type": "bt", "target": { "library": "books", "category": "comics" } },
  "data": { "paths": ["/tank/home-resources/Books/Comics/..."] }
}
```

Events: `task.queued`, `task.started`, `task.completed`, `task.failed`, `task.cancelled`.
