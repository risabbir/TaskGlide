
import type { Column, Priority } from "@/lib/types";
import { ListTodo, Flame, Eye, CheckCircle2, ArrowDown, Minus, ArrowUp, Repeat, Link as LinkIcon } from "lucide-react";

export const APP_NAME = "ProTasker"; // Changed from KanvasAI
export const DEVELOPER_NAME = "R.Sabbir";
export const DEVELOPER_URL = "https://rsabbir.com";

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", icon: ListTodo, taskIds: [] },
  { id: "inprogress", title: "In Progress", icon: Flame, taskIds: [] },
  { id: "review", title: "Review", icon: Eye, taskIds: [] },
  { id: "done", title: "Done", icon: CheckCircle2, taskIds: [] },
];

export const PRIORITIES: Priority[] = ["low", "medium", "high"];

export const PRIORITY_STYLES: Record<Priority, { icon: React.ElementType; colorClass: string; label: string }> = {
  low: { icon: ArrowDown, colorClass: "text-slate-500", label: "Low" },
  medium: { icon: Minus, colorClass: "text-yellow-500", label: "Medium" },
  high: { icon: ArrowUp, colorClass: "text-red-500", label: "High" },
};

export const RECURRENCE_ICON = Repeat;
export const DEPENDENCY_ICON = LinkIcon;

export const DEFAULT_SORT_STATE = {
  criteria: "creationDate" as const,
  direction: "desc" as const,
};

export const DEFAULT_FILTER_STATE = {
  status: DEFAULT_COLUMNS.map(col => col.id),
  priority: undefined,
  dueDate: undefined,
  searchTerm: "",
};

export const MOCK_TASKS_KEY = "protasker_mock_tasks_generated"; // Updated key to reflect new app name
