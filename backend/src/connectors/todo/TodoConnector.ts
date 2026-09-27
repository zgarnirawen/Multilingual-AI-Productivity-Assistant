export interface Todo {
  id: string; title: string; createdAt?: string; dueDate?: string | null; completed?: boolean; [key: string]: unknown;
}
export interface CreateTodoInput { title: string; dueDate?: string | null; [key: string]: unknown; }
export interface UpdateTodoInput { title?: string; dueDate?: string | null; completed?: boolean; [key: string]: unknown; }
export interface TodoConnector {
  listTasks(): Promise<Todo[]>; getTask(id: string): Promise<Todo | null>;
  findTasksByTitle(query: string): Promise<Todo[]>; createTask(input: CreateTodoInput): Promise<Todo>;
  updateTask(id: string, input: UpdateTodoInput): Promise<Todo | null>; deleteTask(id: string): Promise<boolean>;
}
