import { StubTodoConnector } from "../connectors/todo/StubTodoConnector.js";
import { StubAgendaConnector } from "../connectors/agenda/StubAgendaConnector.js";

async function main() {
  const todo = new StubTodoConnector();
  const agenda = new StubAgendaConnector();

  const task = await todo.createTask({ title: "Connector test task" });
  if (!(await todo.getTask(task.id))) throw new Error("Todo create/get contract failed");
  if ((await todo.findTasksByTitle("Connector test")).length !== 1) throw new Error("Todo search contract failed");
  const updatedTask = await todo.updateTask(task.id, { title: "Updated task" });
  if (!updatedTask || updatedTask.title !== "Updated task") throw new Error("Todo update contract failed");
  if (!(await todo.deleteTask(task.id))) throw new Error("Todo delete contract failed");

  const event = await agenda.createEvent({ title: "Connector test event", dateTime: new Date().toISOString() });
  if (!(await agenda.getEvent(event.id))) throw new Error("Agenda create/get contract failed");
  if ((await agenda.findEventsByTitle("Connector test")).length !== 1) throw new Error("Agenda search contract failed");
  const updatedEvent = await agenda.updateEvent(event.id, { title: "Updated event" });
  if (!updatedEvent || updatedEvent.title !== "Updated event") throw new Error("Agenda update contract failed");
  if (!(await agenda.deleteEvent(event.id))) throw new Error("Agenda delete contract failed");

  console.log("Connector contract checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
