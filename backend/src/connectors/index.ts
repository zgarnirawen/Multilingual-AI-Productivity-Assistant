import { TodoConnector } from "./todo/TodoConnector.js";
import { StubTodoConnector } from "./todo/StubTodoConnector.js";
import { TodoApiConnector } from "./todo/TodoApiConnector.js";
import { AgendaConnector } from "./agenda/AgendaConnector.js";
import { StubAgendaConnector } from "./agenda/StubAgendaConnector.js";
import { AgendaApiConnector } from "./agenda/AgendaApiConnector.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(name + " is required when PRODUCTIVITY_CONNECTOR=api");
  return value.endsWith("/") ? value : value + "/";
}
const mode = process.env.PRODUCTIVITY_CONNECTOR ?? "stub";
const token = process.env.PRODUCTIVITY_API_TOKEN;
export const todoConnector: TodoConnector = mode === "api" ? new TodoApiConnector(requiredEnv("TODO_API_URL"), token) : new StubTodoConnector();
export const agendaConnector: AgendaConnector = mode === "api" ? new AgendaApiConnector(requiredEnv("AGENDA_API_URL"), token) : new StubAgendaConnector();
