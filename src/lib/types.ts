
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
  // Timer-related fields
  timerActive: boolean;
  timeSpentSeconds: number;
  timerStartTime: number | null;
}

// New type for tasks when sending to Firestore (dates as strings)
export interface TaskForFirestore extends Omit<Task, 'dueDate' | 'createdAt' | 'updatedAt' | 'subtasks' | 'recurrenceRule' | 'priority'> {
  dueDate?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  priority: string; // Priority as string for Firestore
  subtasks: Array<Pick<Subtask, 'id' | 'title' | 'completed'>>; // Ensure subtasks are plain
  recurrenceRule?: Pick<RecurrenceRule, 'type'>; // Ensure recurrenceRule is plain
}


export interface Column {
  id: string;
  title: string;
  icon?: React.ElementType; // Lucide icon component
  taskIds: string[];
}

// New type for columns when sending to Firestore (no icon)
export interface ColumnForFirestore {
  id: string;
  title: string;
  taskIds: string[];
}


export interface FilterState {
  status: string[]; // array of column IDs
  priority?: Priority;
  dueDate?: "overdue" | "today" | "thisWeek" | "none";
  dueDateStart?: Date;
  dueDateEnd?: Date;
  searchTerm: string;
}

export type SortCriteria = "creationDate" | "dueDate" | "priority";
export type SortDirection = "asc" | "desc";

export interface SortState {
  criteria: SortCriteria;
  direction: SortDirection;
}

