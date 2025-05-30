
"use client";

import type { Task, Column, FilterState, SortState, Priority, RecurrenceRule, Subtask } from "@/lib/types";
import { DEFAULT_COLUMNS, MOCK_TASKS_KEY, DEFAULT_FILTER_STATE, DEFAULT_SORT_STATE } from "@/lib/constants";
import React, { createContext, useReducer, useContext, useEffect, ReactNode } from "react";
import { addDays, addMonths, addWeeks, formatISO } from "date-fns";

interface KanbanState {
  tasks: Task[];
  columns: Column[];
  filters: FilterState;
  sort: SortState;
  isLoading: boolean; // For AI operations or data fetching
  error: string | null; // For displaying errors
  activeTaskModal: Task | null; // Task being edited/viewed
  isTaskModalOpen: boolean;
  isFilterSidebarOpen: boolean;
}

const initialState: KanbanState = {
  tasks: [],
  columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })), // Ensure taskIds is initialized
  filters: DEFAULT_FILTER_STATE,
  sort: DEFAULT_SORT_STATE,
  isLoading: false,
  error: null,
  activeTaskModal: null,
  isTaskModalOpen: false,
  isFilterSidebarOpen: false,
};

type KanbanAction =
  | { type: "SET_INITIAL_DATA"; payload: { tasks: Task[]; columns: Column[] } }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string } // taskId
  | { type: "MOVE_TASK"; payload: { taskId: string; newColumnId: string; newIndex?: number } }
  | { type: "SET_COLUMNS"; payload: Column[] }
  | { type: "SET_FILTERS"; payload: Partial<FilterState> }
  | { type: "SET_SORT"; payload: SortState }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "OPEN_TASK_MODAL"; payload: Task | null } // null for new task
  | { type: "CLOSE_TASK_MODAL" }
  | { type: "TOGGLE_FILTER_SIDEBAR" }
  | { type: "ADD_SUBTASK"; payload: { taskId: string; subtask: Subtask } }
  | { type: "TOGGLE_SUBTASK"; payload: { taskId: string; subtaskId: string } }
  | { type: "UPDATE_SUBTASK"; payload: { taskId: string; subtask: Subtask } }
  | { type: "DELETE_SUBTASK"; payload: { taskId: string; subtaskId: string } };


function getNextDueDate(currentDueDate: Date, rule: RecurrenceRule): Date {
  switch (rule.type) {
    case "daily":
      return addDays(currentDueDate, 1);
    case "weekly":
      return addWeeks(currentDueDate, 1);
    case "monthly":
      return addMonths(currentDueDate, 1);
    default:
      return currentDueDate;
  }
}

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return {
        ...state,
        tasks: action.payload.tasks,
        columns: action.payload.columns.map(col => ({
          ...col,
          taskIds: action.payload.tasks.filter(t => t.columnId === col.id).map(t => t.id)
        })),
      };
    case "ADD_TASK": {
      const newTasks = [...state.tasks, action.payload];
      const newColumns = state.columns.map(column => {
        if (column.id === action.payload.columnId) {
          return { ...column, taskIds: [...column.taskIds, action.payload.id] };
        }
        return column;
      });
      return { ...state, tasks: newTasks, columns: newColumns };
    }
    case "UPDATE_TASK": {
      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload.id ? action.payload : task
      );
      return { ...state, tasks: updatedTasks };
    }
    case "DELETE_TASK": {
      const taskIdToDelete = action.payload;
      const newTasks = state.tasks.filter(task => task.id !== taskIdToDelete);
      const newColumns = state.columns.map(column => ({
        ...column,
        taskIds: column.taskIds.filter(id => id !== taskIdToDelete),
      }));
      return { ...state, tasks: newTasks, columns: newColumns };
    }
    case "MOVE_TASK": {
      const { taskId, newColumnId, newIndex } = action.payload;
      let taskToMove = state.tasks.find(t => t.id === taskId);
      if (!taskToMove) return state;

      const updatedTask = { ...taskToMove, columnId: newColumnId, updatedAt: new Date() };
      let newTasks = state.tasks.map(t => t.id === taskId ? updatedTask : t);
      
      let newColumns = state.columns.map(column => {
        // Remove from old column
        if (column.taskIds.includes(taskId)) {
          return { ...column, taskIds: column.taskIds.filter(id => id !== taskId) };
        }
        return column;
      });

      newColumns = newColumns.map(column => {
        // Add to new column
        if (column.id === newColumnId) {
          const newColTaskIds = [...column.taskIds];
          if (newIndex !== undefined) {
            newColTaskIds.splice(newIndex, 0, taskId);
          } else {
            newColTaskIds.push(taskId);
          }
          return { ...column, taskIds: newColTaskIds };
        }
        return column;
      });
      
      // Handle recurrence
      if (taskToMove.recurrenceRule && taskToMove.dueDate && newColumnId === "done") {
        const nextDueDate = getNextDueDate(taskToMove.dueDate, taskToMove.recurrenceRule);
        const newTask: Task = {
          ...taskToMove,
          id: crypto.randomUUID(),
          dueDate: nextDueDate,
          columnId: DEFAULT_COLUMNS[0].id, // To Do column
          subtasks: taskToMove.subtasks.map(st => ({ ...st, completed: false })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        newTasks.push(newTask);
        newColumns = newColumns.map(column => {
          if (column.id === newTask.columnId) {
            return { ...column, taskIds: [...column.taskIds, newTask.id] };
          }
          return column;
        });
      }

      return { ...state, tasks: newTasks, columns: newColumns };
    }
    case "SET_COLUMNS":
      return { ...state, columns: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_SORT":
      return { ...state, sort: action.payload };
    case "CLEAR_FILTERS":
      return { ...state, filters: DEFAULT_FILTER_STATE, sort: DEFAULT_SORT_STATE };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "OPEN_TASK_MODAL":
      return { ...state, isTaskModalOpen: true, activeTaskModal: action.payload };
    case "CLOSE_TASK_MODAL":
      return { ...state, isTaskModalOpen: false, activeTaskModal: null };
    case "TOGGLE_FILTER_SIDEBAR":
      return { ...state, isFilterSidebarOpen: !state.isFilterSidebarOpen };
    case "ADD_SUBTASK": {
      const { taskId, subtask } = action.payload;
      const newTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, subtasks: [...task.subtasks, subtask] };
        }
        return task;
      });
      return { ...state, tasks: newTasks };
    }
    case "TOGGLE_SUBTASK": {
      const { taskId, subtaskId } = action.payload;
      const newTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
          };
        }
        return task;
      });
      return { ...state, tasks: newTasks };
    }
    case "UPDATE_SUBTASK": {
        const { taskId, subtask: updatedSubtask } = action.payload;
        const newTasks = state.tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    subtasks: task.subtasks.map(st =>
                        st.id === updatedSubtask.id ? updatedSubtask : st
                    ),
                };
            }
            return task;
        });
        return { ...state, tasks: newTasks };
    }
    case "DELETE_SUBTASK": {
        const { taskId, subtaskId } = action.payload;
        const newTasks = state.tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    subtasks: task.subtasks.filter(st => st.id !== subtaskId),
                };
            }
            return task;
        });
        return { ...state, tasks: newTasks };
    }
    default:
      return state;
  }
}

const KanbanContext = createContext<{ state: KanbanState; dispatch: React.Dispatch<KanbanAction> } | undefined>(undefined);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  useEffect(() => {
    // Load initial data from localStorage or a mock generator
    const storedTasks = localStorage.getItem("kanvasai_tasks");
    const storedColumns = localStorage.getItem("kanvasai_columns");
    
    if (storedTasks && storedColumns) {
      try {
        const tasks: Task[] = JSON.parse(storedTasks).map((t: Task) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
        const columns: Column[] = JSON.parse(storedColumns);
        dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns } });
      } catch (e) {
        console.error("Failed to parse stored data, generating mock data.", e);
        generateMockData();
      }
    } else {
      generateMockData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const generateMockData = () => {
    // Check if mock data was already generated in this session to avoid re-generating on HMR
    if (sessionStorage.getItem(MOCK_TASKS_KEY)) {
        const tasksRaw = localStorage.getItem("kanvasai_tasks");
        const columnsRaw = localStorage.getItem("kanvasai_columns");
        if (tasksRaw && columnsRaw) {
            try {
                const tasks: Task[] = JSON.parse(tasksRaw).map((t: Task) => ({
                    ...t,
                    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                    createdAt: new Date(t.createdAt),
                    updatedAt: new Date(t.updatedAt),
                }));
                const columns: Column[] = JSON.parse(columnsRaw);
                dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns } });
                return;
            } catch (e) { /* ignore, proceed to generate */ }
        }
    }

    const mockTasks: Task[] = [
      {
        id: "task-1", title: "Grocery Shopping", description: "Buy milk, eggs, bread, and cheese.", columnId: "todo",
        priority: "medium", tags: ["personal", "errands"], subtasks: [
          { id: "sub-1-1", title: "Buy milk", completed: false },
          { id: "sub-1-2", title: "Buy eggs", completed: true },
        ],
        dependencies: [], createdAt: new Date(), updatedAt: new Date(), dueDate: addDays(new Date(), 2)
      },
      {
        id: "task-2", title: "Project Alpha Design", description: "Finalize UI mockups for Project Alpha.", columnId: "inprogress",
        priority: "high", tags: ["work", "project-alpha", "design"], subtasks: [
          { id: "sub-2-1", title: "Homepage mockup", completed: true },
          { id: "sub-2-2", title: "Dashboard mockup", completed: false },
          { id: "sub-2-3", title: "Settings page mockup", completed: false },
        ],
        dependencies: [], createdAt: new Date(Date.now() - 86400000 * 2), updatedAt: new Date(), dueDate: addDays(new Date(), 5),
        recurrenceRule: { type: "weekly" }
      },
      {
        id: "task-3", title: "Write Blog Post", description: "Draft a blog post about new AI features.", columnId: "todo",
        priority: "medium", tags: ["work", "content"], subtasks: [], dependencies: ["task-2"],
        createdAt: new Date(Date.now() - 86400000 * 1), updatedAt: new Date(),
      },
      {
        id: "task-4", title: "Client Meeting Prep", description: "Prepare slides for Tuesday's client meeting.", columnId: "review",
        priority: "high", tags: ["work", "client"], subtasks: [], dependencies: [],
        createdAt: new Date(), updatedAt: new Date(), dueDate: addDays(new Date(), -1) // Overdue
      },
      {
        id: "task-5", title: "Pay Bills", description: "Pay electricity and internet bills.", columnId: "done",
        priority: "low", tags: ["personal", "finance"], subtasks: [], dependencies: [],
        createdAt: new Date(Date.now() - 86400000 * 5), updatedAt: new Date(), dueDate: addDays(new Date(), -7)
      },
    ];
    const initialColumns = DEFAULT_COLUMNS.map(col => ({
      ...col,
      taskIds: mockTasks.filter(task => task.columnId === col.id).map(task => task.id)
    }));
    
    dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: mockTasks, columns: initialColumns } });
    sessionStorage.setItem(MOCK_TASKS_KEY, "true");
  };

  useEffect(() => {
    // Persist state to localStorage whenever tasks or columns change
    // Avoid saving if initial data is not yet loaded (tasks array is empty but not due to deletion)
    if (state.tasks.length > 0 || localStorage.getItem("kanvasai_tasks")) {
        try {
            const tasksToSave = state.tasks.map(task => ({
                ...task,
                dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
                createdAt: formatISO(task.createdAt),
                updatedAt: formatISO(task.updatedAt),
            }));
            localStorage.setItem("kanvasai_tasks", JSON.stringify(tasksToSave));
            localStorage.setItem("kanvasai_columns", JSON.stringify(state.columns));
        } catch(e) {
            console.error("Failed to save tasks to local storage", e);
        }
    }
  }, [state.tasks, state.columns]);


  return <KanbanContext.Provider value={{ state, dispatch }}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}
