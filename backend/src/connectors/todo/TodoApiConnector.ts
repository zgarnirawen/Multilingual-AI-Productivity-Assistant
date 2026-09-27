import { TodoConnector, Todo, CreateTodoInput, UpdateTodoInput } from "./TodoConnector.js";
export class TodoApiConnector implements TodoConnector {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers); headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", "Bearer " + this.token);
    const response = await fetch(new URL(path, this.baseUrl), { ...init, headers });
    if (!response.ok) throw new Error("Todo API " + response.status + ": " + (await response.text()));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  listTasks() { return this.request<Todo[]>("/tasks"); }
  getTask(id: string) { return this.request<Todo>("/tasks/" + encodeURIComponent(id)).catch(e => {
    if (e instanceof Error && e.message.startsWith("Todo API 404")) return null; throw e;
  }); }
  findTasksByTitle(query: string) { return this.request<Todo[]>("/tasks?search=" + encodeURIComponent(query)); }
  createTask(input: CreateTodoInput) { return this.request<Todo>("/tasks", { method: "POST", body: JSON.stringify(input) }); }
  updateTask(id: string, input: UpdateTodoInput) { return this.request<Todo>("/tasks/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(input) }).catch(e => {
    if (e instanceof Error && e.message.startsWith("Todo API 404")) return null; throw e;
  }); }
  async deleteTask(id: string) {
    try { await this.request<void>("/tasks/" + encodeURIComponent(id), { method: "DELETE" }); return true; }
    catch (e) { if (e instanceof Error && e.message.startsWith("Todo API 404")) return false; throw e; }
  }
}
