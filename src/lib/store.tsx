
"use client";

import type { Task, Column, FilterState, SortState, RecurrenceRule, Subtask, TaskForFirestore, ColumnForFirestore } from "@/lib/types";
import { DEFAULT_COLUMNS, DEFAULT_FILTER_STATE, DEFAULT_SORT_STATE, APP_NAME } from "@/lib/constants";
import React, { createContext, useReducer, useContext, useEffect, ReactNode, useRef, useCallback } from "react";
import { addDays, addMonths, addWeeks, formatISO, parseISO as dateFnsParseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { auth as firebaseAuthInstance } from "@/lib/firebase"; // Renamed for clarity
import { getUserKanbanData, saveUserKanbanData } from "@/services/kanban-service";
import { useToast } from "@/hooks/use-toast"; // Import useToast

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
      console.log("[KanbanReducer] SET_INITIAL_DATA called. Tasks count:", action.payload.tasks.length, "Columns count:", action.payload.columns.length);
      return {
        ...state,
        tasks: action.payload.tasks,
        columns: action.payload.columns.map(col => ({
          ...col,
          taskIds: action.payload.tasks.filter(t => t.columnId === col.id).map(t => t.id)
        })),
        isLoading: false,
        isDataInitialized: true,
        error: null, // Clear previous errors on successful data load
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
      return { ...state, isDataInitialized: action.payload, isLoading: !action.payload }; //isLoading should be false when data is initialized
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
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

const GUEST_TASKS_STORAGE_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_guest_tasks_v2`;
const GUEST_COLUMNS_STORAGE_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_guest_columns_v2`;


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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);
  const lastAuthUserId = useRef<string | null | undefined>(null);

  const handlePermissionDeniedError = useCallback((operation: string, path: string, error: any) => {
    dispatch({ type: "SET_ERROR", payload: `Failed to ${operation} board data due to permissions.` });
    toast({
      title: `Board Data Access Error (${operation})`,
      description: `Could not ${operation} board data. This is likely due to Firestore security rules. Please ensure rules allow access to "${path}" for authenticated users. (Error code: ${error.code || 'UNKNOWN'})`,
      variant: "destructive",
      duration: 15000,
    });
  }, [toast]);


  useEffect(() => {
    isMounted.current = true;
    console.log(`[KanbanProvider] Mount/Auth Effect | Auth loading: ${authLoading}, Context User: ${user?.uid}, Prev Auth User: ${lastAuthUserId.current}, Data Initialized: ${state.isDataInitialized}`);

    if (authLoading) {
      console.log("[KanbanProvider] Auth loading. Waiting for auth state to resolve. Setting isLoading: true.");
      if (!state.isLoading) dispatch({ type: "SET_LOADING", payload: true });
      return;
    }

    const hasUserChanged = user?.uid !== lastAuthUserId.current;
    if (hasUserChanged) {
      console.log(`[KanbanProvider] Auth user CHANGED. Previous: ${lastAuthUserId.current}, New: ${user?.uid}. Resetting data and flags.`);
      lastAuthUserId.current = user?.uid;
      dispatch({ type: "SET_DATA_INITIALIZED", payload: false }); // This will set isLoading to true
      dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } }); // Clear old data
    }


    const loadData = async () => {
      console.log(`[KanbanProvider] loadData called. Current context user: ${user?.uid}, SDK user: ${firebaseAuthInstance.currentUser?.uid}`);
      // Ensure loading is true at the start of a load operation if not already set by hasUserChanged logic
      if (!hasUserChanged && state.isLoading === false) { // Only set loading if not already true
          dispatch({ type: "SET_LOADING", payload: true });
      }

      const currentSdkUser = firebaseAuthInstance.currentUser;

      if (user && currentSdkUser && user.uid === currentSdkUser.uid) {
        console.log(`[KanbanProvider] Logged-in user mode (UID: ${user.uid}). Attempting to initialize from Firestore.`);
        try {
          const firestoreData = await getUserKanbanData(user.uid);
          if (isMounted.current) {
            if (firestoreData) {
              console.log(`[KanbanProvider] Firestore data fetched for user ${user.uid}: ${firestoreData.tasks.length} tasks, ${firestoreData.columns.length} columns.`);
              dispatch({ type: "SET_INITIAL_DATA", payload: firestoreData });
            } else {
              console.log(`[KanbanProvider] No data in Firestore for user ${user.uid}. Initializing with default empty state.`);
              dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
            }
          }
        } catch (error: any) {
          console.error(`[KanbanProvider] Failed to load data from Firestore for user ${user.uid}:`, error);
          if (isMounted.current) {
            if (error.code === 'permission-denied' || error.code === 7) {
              handlePermissionDeniedError('load', `userKanbanData/${user.uid}`, error);
            } else {
              dispatch({ type: "SET_ERROR", payload: "Failed to load tasks from cloud." });
              toast({ title: "Load Error", description: `Failed to load tasks from cloud. Error: ${error.message}`, variant: "destructive" });
            }
             // Ensure state is reset to empty on error, and data initialization is marked complete
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
          }
        }
      } else {
        console.log("[KanbanProvider] Guest user mode. Initializing from localStorage.");
        if (typeof window !== 'undefined' && isMounted.current) {
            try {
                const storedTasks = localStorage.getItem(GUEST_TASKS_STORAGE_KEY);
                const storedColumnsState = localStorage.getItem(GUEST_COLUMNS_STORAGE_KEY);
                console.log("[KanbanProvider] Guest data from localStorage - Tasks:", storedTasks ? "Found" : "Not Found", "Columns:", storedColumnsState ? "Found" : "Not Found");

                if (storedTasks && storedColumnsState) {
                    const tasks: Task[] = JSON.parse(storedTasks).map(parseTaskForStorage);
                    const parsedStoredColumns: Array<{ id: string; title: string; taskIds: string[] }> = JSON.parse(storedColumnsState);
                    
                    const hydratedColumnsMap = new Map(parsedStoredColumns.map(sc => [sc.id, sc]));
                    const hydratedColumns: Column[] = DEFAULT_COLUMNS.map(defaultCol => {
                        const storedColData = hydratedColumnsMap.get(defaultCol.id);
                        return {
                            ...defaultCol,
                            title: storedColData?.title || defaultCol.title, // Use stored title if available
                            taskIds: storedColData ? storedColData.taskIds.filter(taskId => tasks.some(t => t.id === taskId)) : [], // Ensure taskIds are valid
                        };
                    });
                    dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns: hydratedColumns } });
                } else {
                    console.log("[KanbanProvider] No guest data in localStorage. Initializing with default empty state.");
                    dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
                }
            } catch (e: any) {
                console.error("[KanbanProvider] Failed to parse guest data from localStorage:", e);
                toast({ title: "Local Data Error", description: "Could not load tasks from your browser's storage. Starting fresh.", variant: "destructive" });
                dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
            }
        } else if (isMounted.current) {
            console.log("[KanbanProvider] Window undefined or unmounted during guest load. Initializing with default empty state.");
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({...c, taskIds:[]})) } });
        }
      }
    };

    if (!state.isDataInitialized || hasUserChanged) {
        console.log(`[KanbanProvider] Triggering loadData. isDataInitialized: ${state.isDataInitialized}, hasUserChanged: ${hasUserChanged}`);
        loadData();
    } else {
        console.log(`[KanbanProvider] Data already initialized for current user (${user?.uid}), and user has not changed. Skipping loadData. Setting isLoading: false.`);
        if (state.isLoading) dispatch({ type: "SET_LOADING", payload: false });
    }

    return () => {
      // No specific cleanup needed here now that isMounted is handled separately
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, dispatch, toast, handlePermissionDeniedError]); // Removed state.isDataInitialized, state.isLoading as they can cause loops

  // Separate effect for unmount cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      console.log("[KanbanProvider] Unmounted.");
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!isMounted.current || authLoading || !state.isDataInitialized) {
      console.log(`[KanbanProvider] Debounced Save effect SKIPPED: isMounted=${isMounted.current}, authLoading=${authLoading}, isDataInitialized=${state.isDataInitialized}`);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current || !state.isDataInitialized) {
        console.log("[KanbanProvider] Debounced save SKIPPED post-timeout: Component unmounted or data not initialized.");
        return;
      }

      const currentSdkUser = firebaseAuthInstance.currentUser;
      const contextUserId = user?.uid;

      if (contextUserId && currentSdkUser && contextUserId === currentSdkUser.uid) {
        console.log(`[KanbanProvider] CRITICAL CHECK before Firestore save for user ${contextUserId}: SDK auth.currentUser is: ${currentSdkUser.uid}`);
        if (currentSdkUser.uid !== contextUserId) { // Double check, though initial if should catch this
          console.error(`[KanbanProvider] CRITICAL SAVE ERROR: Mismatch or null SDK user before Firestore save. Context user: ${contextUserId}, SDK user: ${currentSdkUser?.uid}. ABORTING SAVE.`);
          toast({ title: "Save Error", description: "Authentication state mismatch. Could not save data to cloud. Please try refreshing.", variant: "destructive" });
          return;
        }
        
        console.log(`[KanbanProvider] Debounced SAVE: Logged-in user mode (UID: ${contextUserId}). Preparing to save ${state.tasks.length} tasks and ${state.columns.length} columns to Firestore.`);
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


          await saveUserKanbanData(contextUserId, sanitizedTasksForFirestore, sanitizedColumnsForFirestore);
          console.log(`[KanbanProvider] Successfully saved data to Firestore for user ${contextUserId}`);
        } catch (error: any) {
          console.error("[KanbanProvider] Failed to save data to Firestore:", error.message, error.code, error);
          if (error.code === 'permission-denied' || error.code === 7) {
            handlePermissionDeniedError('save', `userKanbanData/${contextUserId}`, error);
          } else {
            toast({ title: "Save Error", description: `Failed to save tasks to cloud. Error: ${error.message}`, variant: "destructive" });
          }
        }
      } else {
        console.log(`[KanbanProvider] Debounced SAVE: Guest user mode (Context User: ${contextUserId}, SDK User: ${currentSdkUser?.uid}). Saving to localStorage.`);
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
                console.log("[KanbanProvider] Successfully saved guest data to localStorage.");
            } catch(e: any) {
                console.error("[KanbanProvider] Failed to save guest data to localStorage:", e);
                toast({ title: "Local Save Error", description: "Could not save tasks to your browser's storage.", variant: "destructive" });
            }
        }
      }
    }, 1500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tasks, state.columns, user, authLoading, state.isDataInitialized, dispatch, toast, handlePermissionDeniedError]);


  return <KanbanContext.Provider value={{ state, dispatch }}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

    