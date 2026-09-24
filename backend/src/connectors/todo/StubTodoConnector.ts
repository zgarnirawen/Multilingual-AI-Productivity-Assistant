import { TodoConnector, Todo, CreateTodoInput, UpdateTodoInput } from "./TodoConnector.js";
import { createStubTask, getStubTasks, findTasksByTitle, deleteStubTask, updateStubTask } from "../../services/stubModules.js";
export class StubTodoConnector implements TodoConnector {
  async listTasks(): Promise<Todo[]> { return getStubTasks(); }
  async getTask(id: string): Promise<Todo | null> { return getStubTasks().find(t => t.id === id) ?? null; }
  async findTasksByTitle(query: string): Promise<Todo[]> { return findTasksByTitle(query); }
  async createTask(input: CreateTodoInput): Promise<Todo> { return createStubTask(input.title); }
  async updateTask(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    return input.title === undefined ? this.getTask(id) : updateStubTask(id, input.title);
  }
  async deleteTask(id: string): Promise<boolean> { return deleteStubTask(id); }
}
