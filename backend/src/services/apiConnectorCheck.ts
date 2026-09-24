import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { TodoApiConnector } from "../connectors/todo/TodoApiConnector.js";
import { AgendaApiConnector } from "../connectors/agenda/AgendaApiConnector.js";

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/tasks" && req.method === "GET") {
    res.end(JSON.stringify([
      {
        id: "task-1",
        title: "Test task",
        completed: false,
      },
    ]));
    return;
  }

  if (req.url === "/tasks" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const input = JSON.parse(body);

      res.statusCode = 201;
      res.end(JSON.stringify({
        id: "task-created",
        ...input,
        completed: false,
      }));
    });

    return;
  }

  if (req.url === "/tasks/task-1" && req.method === "PATCH") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const input = JSON.parse(body);

      res.end(JSON.stringify({
        id: "task-1",
        title: input.title ?? "Test task",
        completed: input.completed ?? false,
      }));
    });

    return;
  }

  if (req.url === "/tasks/task-1" && req.method === "DELETE") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/events" && req.method === "GET") {
    res.end(JSON.stringify([
      {
        id: "event-1",
        title: "Test meeting",
        dateTime: "2026-09-25T10:00:00Z",
      },
    ]));
    return;
  }

  if (req.url === "/events" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const input = JSON.parse(body);

      res.statusCode = 201;
      res.end(JSON.stringify({
        id: "event-created",
        ...input,
      }));
    });

    return;
  }

  if (req.url === "/events/event-1" && req.method === "PATCH") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const input = JSON.parse(body);

      res.end(JSON.stringify({
        id: "event-1",
        title: input.title ?? "Test meeting",
        dateTime: input.dateTime ?? "2026-09-25T10:00:00Z",
      }));
    });

    return;
  }

  if (req.url === "/events/event-1" && req.method === "DELETE") {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = await new Promise<number>((resolve) => {
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not determine test server port");
    }

    resolve(address.port);
  });
});

const baseUrl = `http://127.0.0.1:${port}/`;

try {
  const todo = new TodoApiConnector(baseUrl, "test-token");
  const agenda = new AgendaApiConnector(baseUrl, "test-token");

  // --------------------
  // TODO
  // --------------------

  const tasks = await todo.listTasks();

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, "task-1");
  assert.equal(tasks[0].title, "Test task");

  const createdTask = await todo.createTask({
    title: "Created task",
  });

  assert.equal(createdTask.id, "task-created");
  assert.equal(createdTask.title, "Created task");

  const updatedTask = await todo.updateTask("task-1", {
    title: "Updated task",
  });

  assert.ok(updatedTask);
  assert.equal(updatedTask.title, "Updated task");

  const deletedTask = await todo.deleteTask("task-1");

  assert.equal(deletedTask, true);

  // --------------------
  // AGENDA
  // --------------------

  const events = await agenda.listEvents();

  assert.equal(events.length, 1);
  assert.equal(events[0].id, "event-1");
  assert.equal(events[0].title, "Test meeting");

  const createdEvent = await agenda.createEvent({
    title: "Created meeting",
    dateTime: "2026-09-26T14:00:00Z",
  });

  assert.equal(createdEvent.id, "event-created");
  assert.equal(createdEvent.title, "Created meeting");

  const updatedEvent = await agenda.updateEvent("event-1", {
    title: "Updated meeting",
  });

  assert.ok(updatedEvent);
  assert.equal(updatedEvent.title, "Updated meeting");

  const deletedEvent = await agenda.deleteEvent("event-1");

  assert.equal(deletedEvent, true);

  console.log("Todo API connector checks passed.");
  console.log("Agenda API connector checks passed.");
  console.log("All API connector checks passed.");
} finally {
  server.close();
}