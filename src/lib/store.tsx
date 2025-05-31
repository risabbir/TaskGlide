
"use client";

import type { Task, Column, FilterState, SortState, RecurrenceRule, Subtask } from "@/lib/types";
import { DEFAULT_COLUMNS, MOCK_TASKS_KEY, DEFAULT_FILTER_STATE, DEFAULT_SORT_STATE } from "@/lib/constants";
import React, { createContext, useReducer, useContext, useEffect, ReactNode } from "react";
import { addDays, addMonths, addWeeks, formatISO, parseISO as dateFnsParseISO } from "date-fns";

interface KanbanState {
  tasks: Task[];
  columns: Column[];
  filters: FilterState;
  sort: SortState;
  isLoading: boolean; 
  error: string | null; 
  activeTaskModal: Task | null; 
  isTaskModalOpen: boolean;
  isFilterSidebarOpen: boolean;
}

const initialState: KanbanState = {
  tasks: [],
  columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })), 
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
  | { type: "DELETE_TASK"; payload: string } 
  | { type: "MOVE_TASK"; payload: { taskId: string; newColumnId: string; newIndex?: number } }
  | { type: "SET_COLUMNS"; payload: Column[] }
  | { type: "SET_FILTERS"; payload: Partial<FilterState> }
  | { type: "SET_SORT"; payload: SortState }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "OPEN_TASK_MODAL"; payload: Task | null } 
  | { type: "CLOSE_TASK_MODAL" }
  | { type: "TOGGLE_FILTER_SIDEBAR" }
  | { type: "ADD_SUBTASK"; payload: { taskId: string; subtask: Subtask } }
  | { type: "TOGGLE_SUBTASK"; payload: { taskId: string; subtaskId: string } }
  | { type: "UPDATE_SUBTASK"; payload: { taskId: string; subtask: Subtask } }
  | { type: "DELETE_SUBTASK"; payload: { taskId: string; subtaskId: string } }
  | { type: "START_TIMER"; payload: string } 
  | { type: "STOP_TIMER"; payload: string }; 


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
      const taskBeingUpdated = action.payload;
      const oldTask = state.tasks.find(t => t.id === taskBeingUpdated.id);
      let newColumns = state.columns;

      if (oldTask && oldTask.columnId !== taskBeingUpdated.columnId) {
        newColumns = state.columns.map(col => {
          if (col.id === oldTask.columnId) { 
            return { ...col, taskIds: col.taskIds.filter(id => id !== taskBeingUpdated.id) };
          }
          if (col.id === taskBeingUpdated.columnId) { 
            return { ...col, taskIds: [...col.taskIds, taskBeingUpdated.id] };
          }
          return col;
        });
      }
      return { ...state, tasks: updatedTasks, columns: newColumns };
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

      let finalTimeSpentSeconds = taskToMove.timeSpentSeconds;
      let finalTimerActive = taskToMove.timerActive;
      let finalTimerStartTime = taskToMove.timerStartTime;

      if (taskToMove.timerActive && (newColumnId === 'done' || newColumnId === 'review') && taskToMove.timerStartTime) {
        const elapsed = Math.floor((Date.now() - taskToMove.timerStartTime) / 1000);
        finalTimeSpentSeconds += elapsed;
        finalTimerActive = false;
        finalTimerStartTime = null;
      }

      const updatedTask = { 
        ...taskToMove, 
        columnId: newColumnId, 
        updatedAt: new Date(),
        timeSpentSeconds: finalTimeSpentSeconds,
        timerActive: finalTimerActive,
        timerStartTime: finalTimerStartTime,
      };
      
      let newTasks = state.tasks.map(t => t.id === taskId ? updatedTask : t);
      
      let newColumns = state.columns.map(column => {
        if (column.taskIds.includes(taskId)) {
          return { ...column, taskIds: column.taskIds.filter(id => id !== taskId) };
        }
        return column;
      });

      newColumns = newColumns.map(column => {
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
      
      if (taskToMove.recurrenceRule && taskToMove.dueDate && newColumnId === "done") {
        const nextDueDate = getNextDueDate(taskToMove.dueDate instanceof Date ? taskToMove.dueDate : dateFnsParseISO(taskToMove.dueDate as any), taskToMove.recurrenceRule);
        const newTask: Task = {
          ...taskToMove,
          id: crypto.randomUUID(),
          dueDate: nextDueDate,
          columnId: DEFAULT_COLUMNS[0].id, 
          subtasks: taskToMove.subtasks.map(st => ({ ...st, completed: false })),
          createdAt: new Date(),
          updatedAt: new Date(),
          timeSpentSeconds: 0,
          timerActive: false,
          timerStartTime: null,
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
          const updatedTask = { ...task, subtasks: [...task.subtasks, subtask] };
          return updatedTask;
        }
        return task;
      });
      const newActiveModal = state.activeTaskModal && state.activeTaskModal.id === taskId 
                           ? newTasks.find(t => t.id === taskId) || null 
                           : state.activeTaskModal;
      return { ...state, tasks: newTasks, activeTaskModal: newActiveModal };
    }
    case "TOGGLE_SUBTASK": {
      const { taskId, subtaskId } = action.payload;
      const newTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const updatedTask = { ...task, subtasks: updatedSubtasks };
           return updatedTask;
        }
        return task;
      });
      const newActiveModal = state.activeTaskModal && state.activeTaskModal.id === taskId 
                           ? newTasks.find(t => t.id === taskId) || null
                           : state.activeTaskModal;
      return { ...state, tasks: newTasks, activeTaskModal: newActiveModal };
    }
    case "UPDATE_SUBTASK": {
        const { taskId, subtask: updatedSubtask } = action.payload;
        const newTasks = state.tasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = {
                    ...task,
                    subtasks: task.subtasks.map(st =>
                        st.id === updatedSubtask.id ? updatedSubtask : st
                    ),
                };
                return updatedTask;
            }
            return task;
        });
        const newActiveModal = state.activeTaskModal && state.activeTaskModal.id === taskId 
                             ? newTasks.find(t => t.id === taskId) || null
                             : state.activeTaskModal;
        return { ...state, tasks: newTasks, activeTaskModal: newActiveModal };
    }
    case "DELETE_SUBTASK": {
        const { taskId, subtaskId } = action.payload;
        const newTasks = state.tasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = {
                    ...task,
                    subtasks: task.subtasks.filter(st => st.id !== subtaskId),
                };
                return updatedTask;
            }
            return task;
        });
        const newActiveModal = state.activeTaskModal && state.activeTaskModal.id === taskId 
                             ? newTasks.find(t => t.id === taskId) || null
                             : state.activeTaskModal;
        return { ...state, tasks: newTasks, activeTaskModal: newActiveModal };
    }
    case "START_TIMER": {
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, timerActive: true, timerStartTime: Date.now() }
            : task
        ),
      };
    }
    case "STOP_TIMER": {
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload && task.timerActive && task.timerStartTime) {
            const elapsed = Math.floor((Date.now() - task.timerStartTime) / 1000);
            return {
              ...task,
              timerActive: false,
              timeSpentSeconds: task.timeSpentSeconds + elapsed,
              timerStartTime: null,
            };
          }
          return task;
        }),
      };
    }
    default:
      return state;
  }
}

const KanbanContext = createContext<{ state: KanbanState; dispatch: React.Dispatch<KanbanAction> } | undefined>(undefined);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  const parseTaskDate = (dateString?: string | Date): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    try {
      // Attempt to parse ISO string or other common date formats
      const parsed = dateFnsParseISO(dateString);
      if (!isNaN(parsed.getTime())) { // Check if parsed date is valid
        return parsed;
      }
    } catch (e) {
      // If parsing fails, try to construct from number (timestamp) or return undefined
    }
    if (typeof dateString === 'number' || !isNaN(Number(dateString))) {
        const numDate = new Date(Number(dateString));
        if(!isNaN(numDate.getTime())) return numDate;
    }
    return undefined; // Fallback if parsing fails
  };
  
  const parseTask = (task: any): Task => ({
    ...task,
    dueDate: parseTaskDate(task.dueDate),
    createdAt: parseTaskDate(task.createdAt) || new Date(), 
    updatedAt: parseTaskDate(task.updatedAt) || new Date(), 
    subtasks: task.subtasks || [],
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    timerActive: task.timerActive === undefined ? false : task.timerActive,
    timeSpentSeconds: task.timeSpentSeconds === undefined ? 0 : task.timeSpentSeconds,
    timerStartTime: task.timerStartTime === undefined ? null : task.timerStartTime,
  });


  const generateMockData = React.useCallback(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(MOCK_TASKS_KEY)) {
        const tasksRaw = localStorage.getItem("protasker_tasks");
        const columnsStateRaw = localStorage.getItem("protasker_columns"); 

        if (tasksRaw && columnsStateRaw) {
            try {
                const tasks: Task[] = JSON.parse(tasksRaw).map(parseTask);
                const parsedStoredColumns: Array<{ id: string; taskIds: string[] }> = JSON.parse(columnsStateRaw);
                const hydratedColumns: Column[] = DEFAULT_COLUMNS.map(defaultCol => {
                    const storedColData = parsedStoredColumns.find(sc => sc.id === defaultCol.id);
                    return {
                        ...defaultCol, 
                        taskIds: storedColData ? storedColData.taskIds : defaultCol.taskIds || [],
                    };
                });

                dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns: hydratedColumns } });
                return; 
            } catch (e) {
                console.warn("Failed to rehydrate mock data from localStorage, re-generating.", e);
            }
        }
    }

    const mockTasks: Task[] = [
      {
        id: "task-1", title: "Grocery Shopping", description: "Buy milk, eggs, bread, and cheese. Also, grab some fruits like apples and bananas. Check for any ongoing offers on detergents.", columnId: "todo",
        priority: "medium", tags: ["personal", "errands", "groceries"], subtasks: [
          { id: "sub-1-1", title: "Buy milk", completed: false },
          { id: "sub-1-2", title: "Buy eggs", completed: true },
          { id: "sub-1-3", title: "Buy bread", completed: false },
        ],
        dependencies: [], createdAt: new Date(Date.now() - 86400000 * 3), updatedAt: new Date(), dueDate: addDays(new Date(), 2),
        timerActive: false, timeSpentSeconds: 3665, timerStartTime: null,
      },
      {
        id: "task-2", title: "Project Alpha Design Review", description: "Finalize UI mockups for Project Alpha. Collect feedback from the team and prepare for the client presentation. Ensure all components are responsive.", columnId: "inprogress",
        priority: "high", tags: ["work", "project-alpha", "design", "review"], subtasks: [
          { id: "sub-2-1", title: "Homepage mockup feedback", completed: true },
          { id: "sub-2-2", title: "Dashboard mockup iterations", completed: false },
          { id: "sub-2-3", title: "Settings page finalization", completed: false },
        ],
        dependencies: [], createdAt: new Date(Date.now() - 86400000 * 2), updatedAt: new Date(), dueDate: addDays(new Date(), 5),
        recurrenceRule: { type: "weekly" },
        timerActive: true, timeSpentSeconds: 1200, timerStartTime: Date.now() - 300000, 
      },
      {
        id: "task-3", title: "Write Q3 Report", description: "Draft the quarterly report highlighting key achievements and challenges. Include financial summaries and projections.", columnId: "todo",
        priority: "high", tags: ["work", "reporting", "finance"], subtasks: [], dependencies: ["task-2"], 
        createdAt: new Date(Date.now() - 86400000 * 1), updatedAt: new Date(),
        timerActive: false, timeSpentSeconds: 0, timerStartTime: null,
      },
      {
        id: "task-4", title: "Client Meeting - Project Beta", description: "Prepare slides and agenda for Tuesday's client meeting on Project Beta. Focus on timeline and budget.", columnId: "review",
        priority: "high", tags: ["work", "client", "project-beta"], subtasks: [], dependencies: [],
        createdAt: new Date(Date.now() - 86400000 * 4), updatedAt: new Date(), dueDate: addDays(new Date(), -1),
        timerActive: false, timeSpentSeconds: 7200, timerStartTime: null,
      },
      {
        id: "task-5", title: "Pay Utility Bills", description: "Pay electricity, water, and internet bills for the month.", columnId: "done",
        priority: "medium", tags: ["personal", "finance", "bills"], subtasks: [], dependencies: [],
        createdAt: new Date(Date.now() - 86400000 * 5), updatedAt: new Date(), dueDate: addDays(new Date(), -7),
        timerActive: false, timeSpentSeconds: 300, timerStartTime: null, 
      },
       {
        id: "task-6", title: "Plan Weekend Trip", description: "Research destinations and book accommodation for the upcoming weekend trip.", columnId: "todo",
        priority: "low", tags: ["personal", "travel", "leisure"], subtasks: [
            { id: "sub-6-1", title: "Research destinations", completed: false },
            { id: "sub-6-2", title: "Book hotel", completed: false },
            { id: "sub-6-3", title: "Pack bags", completed: false },
        ], dependencies: [], createdAt: new Date(), updatedAt: new Date(),
        timerActive: false, timeSpentSeconds: 0, timerStartTime: null,
      },
    ].map(parseTask);
    const initialColumns = DEFAULT_COLUMNS.map(col => ({
      ...col, 
      taskIds: mockTasks.filter(task => task.columnId === col.id).map(task => task.id)
    }));
    
    dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: mockTasks, columns: initialColumns } });
    if (typeof window !== 'undefined') sessionStorage.setItem(MOCK_TASKS_KEY, "true");
  }, []); 

  useEffect(() => {
    if (typeof window === 'undefined') return; // Don't run on server

    const storedTasks = localStorage.getItem("protasker_tasks"); 
    const storedColumnsState = localStorage.getItem("protasker_columns"); 
    
    if (storedTasks && storedColumnsState) {
      try {
        const tasks: Task[] = JSON.parse(storedTasks).map(parseTask);
        const parsedStoredColumns: Array<{ id: string; title: string; taskIds: string[] }> = JSON.parse(storedColumnsState);
        const hydratedColumns: Column[] = DEFAULT_COLUMNS.map(defaultCol => {
          const storedColData = parsedStoredColumns.find(sc => sc.id === defaultCol.id);
          return {
            ...defaultCol,
            taskIds: storedColData ? storedColData.taskIds : defaultCol.taskIds || [],
          };
        });

        dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns: hydratedColumns } });
      } catch (e) {
        console.error("Failed to parse stored data, generating mock data.", e);
        generateMockData();
      }
    } else {
      generateMockData();
    }
  }, [generateMockData]);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    if (state.tasks.length > 0 || localStorage.getItem("protasker_tasks")) { 
        try {
            const tasksToSave = state.tasks.map(task => ({
                ...task,
                dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
                createdAt: formatISO(task.createdAt),
                updatedAt: formatISO(task.updatedAt),
            }));
            localStorage.setItem("protasker_tasks", JSON.stringify(tasksToSave)); 

            const columnsStateToSave = state.columns.map(col => ({
                id: col.id,
                title: col.title, 
                taskIds: col.taskIds,
            }));
            localStorage.setItem("protasker_columns", JSON.stringify(columnsStateToSave)); 
        } catch(e) {
            console.error("Failed to save state to local storage", e);
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

