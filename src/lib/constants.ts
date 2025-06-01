
import type { Column, Priority, FilterState, SortState } from "@/lib/types";
import { ListTodo, Flame, Eye, CheckCircle2, ArrowDown, Minus, ArrowUp, Repeat, Link as LinkIcon } from "lucide-react";

export const APP_NAME = "TaskGlide"; // Changed back from KanvasAI
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

export const DEFAULT_SORT_STATE: SortState = {
  criteria: "creationDate",
  direction: "desc",
};

export const DEFAULT_FILTER_STATE: FilterState = {
  status: DEFAULT_COLUMNS.map(col => col.id),
  priority: undefined,
  dueDate: undefined,
  dueDateStart: undefined,
  dueDateEnd: undefined,
  searchTerm: "",
};

