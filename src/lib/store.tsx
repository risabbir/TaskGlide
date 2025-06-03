
"use client";

import type { Task, Column, FilterState, SortState, RecurrenceRule, Subtask, TaskForFirestore, ColumnForFirestore } from "@/lib/types";
import { DEFAULT_COLUMNS, DEFAULT_FILTER_STATE, DEFAULT_SORT_STATE, APP_NAME } from "@/lib/constants";
import React, { createContext, useReducer, useContext, useEffect, ReactNode, useRef, useCallback } from "react";
import { addDays, addMonths, addWeeks, formatISO, parseISO as dateFnsParseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase"; // Import auth directly for SDK check
import { getUserKanbanData, saveUserKanbanData } from "@/services/kanban-service";

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
  isDataInitialized: boolean;
}

const initialState: KanbanState = {
  tasks: [],
  columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })), 
  filters: DEFAULT_FILTER_STATE,
  sort: DEFAULT_SORT_STATE,
  isLoading: true,
  error: null,
  activeTaskModal: null,
  isTaskModalOpen: false,
  isFilterSidebarOpen: false,
  isDataInitialized: false,
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
  | { type: "SET_DATA_INITIALIZED"; payload: boolean }
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
        isLoading: false,
        isDataInitialized: true,
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
    case "SET_DATA_INITIALIZED":
      return { ...state, isDataInitialized: action.payload, isLoading: !action.payload };
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

const GUEST_TASKS_STORAGE_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_guest_tasks`;
const GUEST_COLUMNS_STORAGE_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_guest_columns`;


const parseTaskDateForStorage = (dateString?: string | Date): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    try {
      const parsed = dateFnsParseISO(dateString);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch (e) { /* ignore */ }
    if (typeof dateString === 'number' || !isNaN(Number(dateString))) {
        const numDate = new Date(Number(dateString));
        if(!isNaN(numDate.getTime())) return numDate;
    }
    return undefined; 
};
  
const parseTaskForStorage = (task: any): Task => ({
    ...task,
    dueDate: parseTaskDateForStorage(task.dueDate),
    createdAt: parseTaskDateForStorage(task.createdAt) || new Date(), 
    updatedAt: parseTaskDateForStorage(task.updatedAt) || new Date(), 
    subtasks: task.subtasks || [],
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    recurrenceRule: task.recurrenceRule || undefined,
    timerActive: task.timerActive === undefined ? false : task.timerActive,
    timeSpentSeconds: task.timeSpentSeconds === undefined ? 0 : task.timeSpentSeconds,
    timerStartTime: task.timerStartTime === undefined ? null : task.timerStartTime,
});


export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const { user, loading: authLoading } = useAuth(); // user from AuthContext
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false); 

  useEffect(() => {
    isMounted.current = true;
    if (authLoading) {
      dispatch({ type: "SET_LOADING", payload: true });
      return; 
    }

    const loadData = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      const currentAuthUserFromSDK = auth.currentUser; // Direct SDK check

      if (user && currentAuthUserFromSDK && user.uid === currentAuthUserFromSDK.uid) { 
        console.log(`[KanbanProvider] loadData: Context user ID: ${user.uid}, auth.currentUser ID: ${currentAuthUserFromSDK.uid}. Loading from Firestore.`);
        try {
          const firestoreData = await getUserKanbanData(user.uid);
          if (firestoreData) {
            dispatch({ type: "SET_INITIAL_DATA", payload: firestoreData });
          } else {
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
          }
        } catch (error) {
          console.error("[KanbanProvider] Failed to load data from Firestore:", error);
          dispatch({ type: "SET_ERROR", payload: "Failed to load tasks from cloud." });
          dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
        }
      } else {
        if (user || currentAuthUserFromSDK) { // Log if there's a mismatch or only one is present
            console.warn(`[KanbanProvider] loadData: Auth state inconsistency. Context user ID: ${user?.uid}, auth.currentUser ID: ${currentAuthUserFromSDK?.uid}. Defaulting to guest data.`);
        } else {
            console.log("[KanbanProvider] loadData: No authenticated user. Loading guest data from localStorage.");
        }
        // Load guest data
        if (typeof window !== 'undefined') {
            const storedTasks = localStorage.getItem(GUEST_TASKS_STORAGE_KEY);
            const storedColumnsState = localStorage.getItem(GUEST_COLUMNS_STORAGE_KEY);
            if (storedTasks && storedColumnsState) {
                try {
                    const tasks: Task[] = JSON.parse(storedTasks).map(parseTaskForStorage);
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
                    console.error("[KanbanProvider] Failed to parse guest data from localStorage", e);
                    dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
                }
            } else {
                 dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
            }
        } else { // Should not happen on client, but good for completeness
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
        }
      }
    };

    loadData();
    
    return () => { isMounted.current = false; };
  }, [user, authLoading]);


  useEffect(() => {
    if (!isMounted.current || authLoading || !state.isDataInitialized) {
      return; 
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const currentAuthUserFromSDK = auth.currentUser; // Direct SDK check

      if (user && currentAuthUserFromSDK && user.uid === currentAuthUserFromSDK.uid) { 
        console.log(`[KanbanProvider] saveData: Context user ID: ${user.uid}, auth.currentUser ID: ${currentAuthUserFromSDK.uid}. Saving to Firestore.`);
        try {
          const sanitizedTasksForFirestore: TaskForFirestore[] = state.tasks.map(task => ({
            ...task,
            dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
            createdAt: formatISO(task.createdAt),
            updatedAt: formatISO(task.updatedAt),
            subtasks: task.subtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed })),
            recurrenceRule: task.recurrenceRule ? { type: task.recurrenceRule.type } : undefined,
          }));

          const sanitizedColumnsForFirestore: ColumnForFirestore[] = state.columns.map(col => ({
            id: col.id,
            title: col.title,
            taskIds: col.taskIds,
          }));

          await saveUserKanbanData(user.uid, sanitizedTasksForFirestore, sanitizedColumnsForFirestore);
        } catch (error) {
          console.error("[KanbanProvider] Failed to save data to Firestore:", error);
          // Optionally: dispatch({ type: "SET_ERROR", payload: "Failed to save tasks to cloud." });
        }
      } else {
        if (user || currentAuthUserFromSDK) {
             console.warn(`[KanbanProvider] saveData: Auth state inconsistency. Context user ID: ${user?.uid}, auth.currentUser ID: ${currentAuthUserFromSDK?.uid}. Not saving to Firestore.`);
        } else {
             console.log("[KanbanProvider] saveData: No authenticated user. Saving guest data to localStorage.");
        }
        // Save guest data
        if (typeof window !== 'undefined') {
            try {
                const tasksToSaveForGuest = state.tasks.map(task => ({
                    ...task,
                    dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
                    createdAt: formatISO(task.createdAt),
                    updatedAt: formatISO(task.updatedAt),
                }));
                localStorage.setItem(GUEST_TASKS_STORAGE_KEY, JSON.stringify(tasksToSaveForGuest));

                const columnsStateToSaveForGuest = state.columns.map(col => ({
                    id: col.id,
                    title: col.title, 
                    taskIds: col.taskIds,
                }));
                localStorage.setItem(GUEST_COLUMNS_STORAGE_KEY, JSON.stringify(columnsStateToSaveForGuest));
            } catch(e) {
                console.error("[KanbanProvider] Failed to save guest data to localStorage", e);
            }
        }
      }
    }, 1000); 

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [state.tasks, state.columns, user, authLoading, state.isDataInitialized]);


  return <KanbanContext.Provider value={{ state, dispatch }}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

