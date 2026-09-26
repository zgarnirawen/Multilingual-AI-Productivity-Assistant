import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { TodoApiConnector } from "../connectors/todo/TodoApiConnector.js";
import { AgendaApiConnector } from "../connectors/agenda/AgendaApiConnector.js";

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader("Content-Type", "application/json");

  const auth = req.headers.authorization;

  if (auth !== "Bearer test-token") {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // --------------------
  // TODO
  // --------------------

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

  if (req.url === "/tasks?search=invoice" && req.method === "GET") {
    res.end(JSON.stringify([
      {
        id: "task-search",
        title: "Invoice follow-up",
        completed: false,
      },
    ]));
    return;
  }

  if (req.url === "/tasks/task-1" && req.method === "GET") {
    res.end(JSON.stringify({
      id: "task-1",
      title: "Test task",
      completed: false,
    }));
    return;
  }

  if (req.url === "/tasks/missing" && req.method === "GET") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (req.url === "/tasks/server-error" && req.method === "GET") {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal server error" }));
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

  if (req.url === "/tasks/missing" && req.method === "DELETE") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // --------------------
  // AGENDA
  // --------------------

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

  if (req.url === "/events?search=meeting" && req.method === "GET") {
    res.end(JSON.stringify([
      {
        id: "event-search",
        title: "Project meeting",
        dateTime: "2026-09-25T14:00:00Z",
      },
    ]));
    return;
  }

  if (
    req.url === "/events?startDate=2026-09-25&endDate=2026-09-30" &&
    req.method === "GET"
  ) {
    res.end(JSON.stringify([
      {
        id: "event-range",
        title: "Range event",
        dateTime: "2026-09-27T09:00:00Z",
      },
    ]));
    return;
  }

  if (req.url === "/events/event-1" && req.method === "GET") {
    res.end(JSON.stringify({
      id: "event-1",
      title: "Test meeting",
      dateTime: "2026-09-25T10:00:00Z",
    }));
    return;
  }

  if (req.url === "/events/missing" && req.method === "GET") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (req.url === "/events/server-error" && req.method === "GET") {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal server error" }));
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

  if (req.url === "/events/missing" && req.method === "DELETE") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
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
  // TODO: CRUD
  // --------------------

  const tasks = await todo.listTasks();

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, "task-1");
  assert.equal(tasks[0].title, "Test task");

  const task = await todo.getTask("task-1");

  assert.ok(task);
  assert.equal(task.id, "task-1");

  const searchedTasks = await todo.findTasksByTitle("invoice");

  assert.equal(searchedTasks.length, 1);
  assert.equal(searchedTasks[0].title, "Invoice follow-up");

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
  // TODO: 404 + errors
  // --------------------

  const missingTask = await todo.getTask("missing");

  assert.equal(missingTask, null);

  const missingDeletedTask = await todo.deleteTask("missing");

  assert.equal(missingDeletedTask, false);

  await assert.rejects(
    () => todo.getTask("server-error"),
    /Todo API 500/
  );

  // --------------------
  // AGENDA: CRUD
  // --------------------

  const events = await agenda.listEvents();

  assert.equal(events.length, 1);
  assert.equal(events[0].id, "event-1");
  assert.equal(events[0].title, "Test meeting");

  const event = await agenda.getEvent("event-1");

  assert.ok(event);
  assert.equal(event.id, "event-1");

  const searchedEvents = await agenda.findEventsByTitle("meeting");

  assert.equal(searchedEvents.length, 1);
  assert.equal(searchedEvents[0].title, "Project meeting");

  const rangeEvents = await agenda.listEvents(
    "2026-09-25",
    "2026-09-30"
  );

  assert.equal(rangeEvents.length, 1);
  assert.equal(rangeEvents[0].id, "event-range");

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

  // --------------------
  // AGENDA: 404 + errors
  // --------------------

  const missingEvent = await agenda.getEvent("missing");

  assert.equal(missingEvent, null);

  const missingDeletedEvent = await agenda.deleteEvent("missing");

  assert.equal(missingDeletedEvent, false);

  await assert.rejects(
    () => agenda.getEvent("server-error"),
    /Agenda API 500/
  );

  console.log("Todo API connector checks passed.");
  console.log("Agenda API connector checks passed.");
  console.log("Authentication checks passed.");
  console.log("404 handling checks passed.");
  console.log("Error handling checks passed.");
  console.log("All API connector checks passed.");
} finally {
  server.close();
}