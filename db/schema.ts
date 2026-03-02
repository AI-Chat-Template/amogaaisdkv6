type TaskStatus = "todo" | "in-progress" | "done" | "canceled";
type TaskLabel = "bug" | "feature" | "enhancement" | "documentation";
type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  code: string;
  title?: string;
  status: TaskStatus;
  label: TaskLabel;
  priority: TaskPriority;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">;

export const tasks: Task[] = [];
