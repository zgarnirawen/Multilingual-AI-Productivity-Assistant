import {
  TodoConnector,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from "./TodoConnector.js";

import {
  createStubTask,
  getStubTasks,
  findTasksByTitle,
  deleteStubTask,
  updateStubTask,
} from "../../services/stubModules.js";

const toTodo = (task: {
  id: string;
  title: string;
  createdAt: string;
}): Todo => ({
  id: task.id,
  title: task.title,
  createdAt: task.createdAt,
});

export class StubTodoConnector implements TodoConnector {
  async listTasks(): Promise<Todo[]> {
    return getStubTasks().map(toTodo);
  }

  async getTask(id: string): Promise<Todo | null> {
    const task = getStubTasks().find((t) => t.id === id);
    return task ? toTodo(task) : null;
  }

  async findTasksByTitle(query: string): Promise<Todo[]> {
    return findTasksByTitle(query).map(toTodo);
  }

  async createTask(input: CreateTodoInput): Promise<Todo> {
    return toTodo(createStubTask(input.title));
  }

  async updateTask(
    id: string,
    input: UpdateTodoInput
  ): Promise<Todo | null> {
    if (input.title === undefined) {
      return this.getTask(id);
    }

    const task = updateStubTask(id, input.title);
    return task ? toTodo(task) : null;
  }

  async deleteTask(id: string): Promise<boolean> {
    return deleteStubTask(id);
  }
}
