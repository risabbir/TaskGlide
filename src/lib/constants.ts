
import type { Column, Priority, FilterState, SortState } from "@/lib/types";
import { ListTodo, Flame, CheckCircle2, ArrowDown, Minus, ArrowUp, Repeat, Link as LinkIcon } from "lucide-react";

export const APP_NAME = "TaskGlide"; 
export const DEVELOPER_NAME = "R.Sabbir";
export const DEVELOPER_URL = "https://rsabbir.com";
export const GITHUB_URL = "https://github.com/risabbir/TaskGlide"; // Add your repository link here

export const GUEST_ID_STORAGE_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_guest_id_v1`;

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", icon: ListTodo, taskIds: [] },
  { id: "inprogress", title: "In Progress", icon: Flame, taskIds: [] },
  // { id: "review", title: "Review", icon: Eye, taskIds: [] }, // Removed Review column
  { id: "done", title: "Done", icon: CheckCircle2, taskIds: [] },
];

export const PRIORITIES: Priority[] = ["low", "medium", "high"];

export const PRIORITY_STYLES: Record<Priority, { icon: React.ElementType; colorClass: string; label: string }> = {
  low: { icon: ArrowDown, colorClass: "text-chart-3", label: "Low" },
  medium: { icon: Minus, colorClass: "text-chart-5", label: "Medium" },
  high: { icon: ArrowUp, colorClass: "text-destructive", label: "High" },
};

export const RECURRENCE_ICON = Repeat;
export const DEPENDENCY_ICON = LinkIcon;

export const DEFAULT_SORT_STATE: SortState = {
  criteria: "creationDate",
  direction: "desc",
};

export const DEFAULT_FILTER_STATE: FilterState = {
  status: DEFAULT_COLUMNS.map(col => col.id), // Default to all statuses (columns) selected
  priority: undefined,
  dueDate: undefined,
  dueDateStart: undefined,
  dueDateEnd: undefined,
  searchTerm: "",
};
