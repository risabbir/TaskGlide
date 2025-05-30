
export type Priority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type RecurrenceType = "daily" | "weekly" | "monthly";

export interface RecurrenceRule {
  type: RecurrenceType;
  // interval: number; // e.g., every 2 weeks, interval = 2. For simplicity, assuming interval 1 for now.
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  dueDate?: Date;
  priority: Priority;
  tags: string[];
  subtasks: Subtask[];
  dependencies: string[]; // Array of task IDs
  recurrenceRule?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  icon?: React.ElementType; // Lucide icon component
  taskIds: string[];
}

export interface FilterState {
  status: string[]; // array of column IDs
  priority?: Priority;
  dueDate?: "overdue" | "today" | "thisWeek" | "none";
  searchTerm: string;
}

export type SortCriteria = "creationDate" | "dueDate" | "priority";
export type SortDirection = "asc" | "desc";

export interface SortState {
  criteria: SortCriteria;
  direction: SortDirection;
}
