
"use client";

import type { Task, Column, FilterState, SortState, RecurrenceRule, Subtask, TaskForFirestore, ColumnForFirestore } from "@/lib/types";
import { DEFAULT_COLUMNS, DEFAULT_FILTER_STATE, DEFAULT_SORT_STATE, APP_NAME, GUEST_ID_STORAGE_KEY } from "@/lib/constants";
import React, { createContext, useReducer, useContext, useEffect, ReactNode, useRef, useCallback } from "react";
import { addDays, addMonths, addWeeks, formatISO, parseISO as dateFnsParseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { auth as firebaseAuthInstance } from "@/lib/firebase"; // Direct import for SDK checks
import { getUserKanbanData, saveUserKanbanData } from "@/services/kanban-service";
import { useToast } from "@/hooks/use-toast";

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
  isLoading: true, // Start true until first load attempt
  error: null,
  activeTaskModal: null,
  isTaskModalOpen: false,
  isFilterSidebarOpen: false,
  isDataInitialized: false, // Start false
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
        error: null,
      };
    case "ADD_TASK": {
      console.log("[KanbanReducer] ADD_TASK:", action.payload.title);
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
      console.log("[KanbanReducer] UPDATE_TASK:", action.payload.title);
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
      console.log("[KanbanReducer] DELETE_TASK:", action.payload);
      const taskIdToDelete = action.payload;
      const newTasks = state.tasks.filter(task => task.id !== taskIdToDelete);
      const newColumns = state.columns.map(column => ({
        ...column,
        taskIds: column.taskIds.filter(id => id !== taskIdToDelete),
      }));
      return { ...state, tasks: newTasks, columns: newColumns };
    }
    case "MOVE_TASK": {
      console.log("[KanbanReducer] MOVE_TASK: taskId", action.payload.taskId, "to column", action.payload.newColumnId);
      const { taskId, newColumnId, newIndex } = action.payload;
      let taskToMove = state.tasks.find(t => t.id === taskId);
      if (!taskToMove) return state;

      const oldColumnId = taskToMove.columnId;
      let finalTimeSpentSeconds = taskToMove.timeSpentSeconds;
      let finalTimerActive = taskToMove.timerActive;
      let finalTimerStartTime = taskToMove.timerStartTime;

      if (taskToMove.timerActive && taskToMove.timerStartTime && (
          (oldColumnId === 'inprogress' && newColumnId !== 'inprogress') ||
          newColumnId === 'done'
        )) {
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
          subtasks: (taskToMove.subtasks || []).map(st => ({ ...st, completed: false })),
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
          const updatedTask = { ...task, subtasks: [...(task.subtasks || []), subtask] };
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
          const updatedSubtasks = (task.subtasks || []).map(st =>
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
                    subtasks: (task.subtasks || []).map(st =>
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
                    subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId),
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
    id: task.id,
    title: task.title,
    description: task.description,
    columnId: task.columnId,
    priority: task.priority,
    dueDate: parseTaskDateForStorage(task.dueDate),
    createdAt: parseTaskDateForStorage(task.createdAt) || new Date(),
    updatedAt: parseTaskDateForStorage(task.updatedAt) || new Date(),
    subtasks: (task.subtasks || []).map((st: any) => ({ id: st.id, title: st.title, completed: !!st.completed })),
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    recurrenceRule: task.recurrenceRule || undefined,
    timerActive: task.timerActive === undefined ? false : task.timerActive,
    timeSpentSeconds: task.timeSpentSeconds === undefined ? 0 : task.timeSpentSeconds,
    timerStartTime: task.timerStartTime === undefined ? null : task.timerStartTime,
});


export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const {
    user: authContextUser,
    loading: authLoading,
    guestId: authContextGuestId,
  } = useAuth();
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  const authUserRef = useRef(authContextUser);
  const guestIdRef = useRef(authContextGuestId);
  const lastAuthIdentifierRef = useRef<string | null>(null);

  useEffect(() => {
    authUserRef.current = authContextUser;
  }, [authContextUser]);

  useEffect(() => {
    guestIdRef.current = authContextGuestId;
  }, [authContextGuestId]);


  const handlePermissionDeniedError = useCallback((operation: string, errorDetails: string) => {
    // The errorDetails should now come directly from kanban-service with context
    dispatch({ type: "SET_ERROR", payload: `Failed to ${operation} board data due to permissions.` });
    toast({
      title: `Board Data Access Error: ${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed`,
      description: errorDetails, // This will contain the detailed message from kanban-service
      variant: "destructive",
      duration: 30000, 
    });
  }, [toast]);


  const loadData = useCallback(async (identifierToLoad: string, contextUserAtLoadTime: typeof authContextUser, guestIdAtLoadTime: typeof authContextGuestId) => {
    if (!isMounted.current) {
      console.log("[KanbanProvider] loadData: Component unmounted. Aborting load.");
      return;
    }
    console.log(`[KanbanProvider] loadData: Called for identifier '${identifierToLoad}'. ContextUser UID: ${contextUserAtLoadTime?.uid}, GuestID: ${guestIdAtLoadTime}`);

    if (!state.isLoading) dispatch({ type: "SET_LOADING", payload: true });

    if (contextUserAtLoadTime?.uid === identifierToLoad) {
      const userIdToLoad = contextUserAtLoadTime.uid;
      console.log(`[KanbanProvider] loadData: Logged-in user mode (UID: ${userIdToLoad}). Fetching from Firestore via server action.`);
      try {
        const firestoreData = await getUserKanbanData(userIdToLoad); // This is now a server action call
        if (isMounted.current) {
          if (firestoreData) {
            dispatch({ type: "SET_INITIAL_DATA", payload: firestoreData });
          } else {
            // This case might occur if getUserKanbanData returns null (e.g., due to internal error before Firestore call)
            // Or if Firestore has no data (which returns empty arrays in the payload)
            console.warn(`[KanbanProvider] loadData: No data returned from getUserKanbanData for user ${userIdToLoad}. Initializing with empty state.`);
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
          }
        }
      } catch (error: any) {
        console.error(`[KanbanProvider] loadData: Error CAUGHT from getUserKanbanData (Server Action) for user ${userIdToLoad}:`, error.message);
        if (isMounted.current) {
          if (error.message && error.message.startsWith('Firestore permission denied')) {
            handlePermissionDeniedError('load', error.message);
          } else {
            dispatch({ type: "SET_ERROR", payload: `Failed to load tasks from cloud. Detail: ${error.message || 'Unknown error.'}` });
          }
          // Fallback to empty state on any error
          dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
        }
      }
    } else if (guestIdAtLoadTime === identifierToLoad) {
      console.log(`[KanbanProvider] loadData: Guest mode (Guest ID: ${guestIdAtLoadTime}). Loading from localStorage.`);
      if (typeof window !== 'undefined' && isMounted.current) {
        try {
          const storedTasks = localStorage.getItem(GUEST_TASKS_STORAGE_KEY);
          const storedColumnsState = localStorage.getItem(GUEST_COLUMNS_STORAGE_KEY);
          if (storedTasks && storedColumnsState) {
            const tasks: Task[] = JSON.parse(storedTasks).map(parseTaskForStorage);
            const parsedStoredColumns: Array<{ id: string; title: string; taskIds: string[] }> = JSON.parse(storedColumnsState);
            const hydratedColumnsMap = new Map(parsedStoredColumns.map(sc => [sc.id, sc]));
            const hydratedColumns: Column[] = DEFAULT_COLUMNS.map(defaultCol => {
              const storedColData = hydratedColumnsMap.get(defaultCol.id);
              return { ...defaultCol, title: storedColData?.title || defaultCol.title, taskIds: storedColData ? storedColData.taskIds.filter(taskId => tasks.some(t => t.id === taskId)) : [] };
            });
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks, columns: hydratedColumns } });
          } else {
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
          }
        } catch (e: any) {
          console.error("[KanbanProvider] loadData: Failed to parse guest data from localStorage:", e);
          dispatch({ type: "SET_ERROR", payload: "Error loading local data." });
          dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
        }
      }
    } else {
      console.warn(`[KanbanProvider] loadData: Identifier '${identifierToLoad}' does not match current contextUser or guestId. Aborting specific load.`);
      dispatch({ type: "SET_LOADING", payload: false });
      if (!state.isDataInitialized) dispatch({ type: "SET_DATA_INITIALIZED", payload: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, handlePermissionDeniedError]); 

  useEffect(() => {
    isMounted.current = true;
    const activeIdentifier = authContextUser?.uid || authContextGuestId;

    console.log(`[KanbanProvider] Mount/Auth Effect | Auth loading: ${authLoading}, Current Identifier (from context): ${activeIdentifier}, Prev Identifier (ref): ${lastAuthIdentifierRef.current}, Data Initialized: ${state.isDataInitialized}`);

    if (authLoading && !authContextGuestId) {
        console.log("[KanbanProvider] Mount/Auth Effect: Auth is loading and no guest ID. Waiting for auth state. Setting isLoading: true.");
        if (!state.isLoading) dispatch({ type: "SET_LOADING", payload: true });
        return;
    }

    if (activeIdentifier !== lastAuthIdentifierRef.current) {
        console.log(`[KanbanProvider] Mount/Auth Effect: Identifier CHANGED. Prev: ${lastAuthIdentifierRef.current}, New: ${activeIdentifier}. Resetting Kanban state.`);
        lastAuthIdentifierRef.current = activeIdentifier;
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_DATA_INITIALIZED", payload: false });
        dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });

        if (activeIdentifier) {
            console.log(`[KanbanProvider] Mount/Auth Effect: New active identifier '${activeIdentifier}'. Initiating data load.`);
            loadData(activeIdentifier, authContextUser, authContextGuestId);
        } else {
            console.log("[KanbanProvider] Mount/Auth Effect: No active identifier (user signed out, no guest). State is clean. Setting isLoading false, data initialized.");
            dispatch({ type: "SET_LOADING", payload: false });
            dispatch({ type: "SET_DATA_INITIALIZED", payload: true });
        }
    } else if (activeIdentifier && !state.isDataInitialized && !state.isLoading) {
        console.log(`[KanbanProvider] Mount/Auth Effect: Identifier '${activeIdentifier}' same, data not initialized, not loading. Retrying load.`);
        dispatch({ type: "SET_LOADING", payload: true });
        loadData(activeIdentifier, authContextUser, authContextGuestId);
    } else if (!activeIdentifier && state.isLoading && !authLoading) {
        console.log(`[KanbanProvider] Mount/Auth Effect: No active identifier, provider isLoading=true, authLoading=false. Setting isLoading false, data initialized.`);
        dispatch({ type: "SET_LOADING", payload: false });
        if(!state.isDataInitialized) dispatch({ type: "SET_DATA_INITIALIZED", payload: true });
    } else if (activeIdentifier && state.isDataInitialized && state.isLoading) {
        console.log(`[KanbanProvider] Mount/Auth Effect: Identifier '${activeIdentifier}' same, data initialized, but isLoading=true. Setting isLoading false.`);
         dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [authContextUser, authContextGuestId, authLoading, loadData, state.isDataInitialized, state.isLoading, dispatch]);


  useEffect(() => {
    return () => {
      isMounted.current = false;
      console.log("[KanbanProvider] Unmounted globally.");
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!isMounted.current || !state.isDataInitialized || authLoading) {
      console.log(
        `[KanbanProvider] Debounced Save effect SKIPPED (initial check): isMounted=${isMounted.current}, isDataInitialized=${state.isDataInitialized}, authLoading=${authLoading}`
      );
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    console.log(
      `[KanbanProvider] Debounced Save effect: Data/Auth context changed. Scheduling save. ` +
      `Tasks: ${state.tasks.length}, Columns: ${state.columns.length}, ` +
      `AuthUserRef (at schedule): ${authUserRef.current?.uid}, GuestIdRef (at schedule): ${guestIdRef.current}, AuthLoading (at schedule): ${authLoading}`
    );

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current || !state.isDataInitialized) {
        console.log(
          `[KanbanProvider] Debounced Save TIMEOUT SKIPPED (inner check): Component unmounted or data not initialized. ` +
          `isMounted=${isMounted.current}, isDataInitialized=${state.isDataInitialized}`
        );
        return;
      }

      const clientSdkUserAtSaveTime = firebaseAuthInstance.currentUser; 
      const userForSaveAttempt = authUserRef.current; 
      const guestForSaveAttempt = guestIdRef.current; 

      console.log(
        `[KanbanProvider] Debounced Save TIMEOUT EXECUTING. ` +
        `Client SDK User (at save time): ${clientSdkUserAtSaveTime?.uid} (Email: ${clientSdkUserAtSaveTime?.email}), ` +
        `AuthUserRef (at schedule time): ${userForSaveAttempt?.uid}, GuestIdRef (at schedule time): ${guestForSaveAttempt}, Tasks: ${state.tasks.length}`
      );

      if (clientSdkUserAtSaveTime) { 
        const userIdForSave = clientSdkUserAtSaveTime.uid;

        if (userForSaveAttempt && userForSaveAttempt.uid !== userIdForSave) {
          console.error(`[KanbanProvider] CRITICAL AUTH MISMATCH (Client-Side Save Prep): AuthContext user (at schedule) ${userForSaveAttempt.uid} vs SDK user (at save) ${userIdForSave}. Aborting save call.`);
          toast({ title: "Save Error", description: "Critical authentication mismatch detected before saving. Please re-login.", variant: "destructive" });
          return;
        }
        if (!userForSaveAttempt && guestForSaveAttempt) {
            console.warn(`[KanbanProvider] Auth state changed from GUEST (${guestForSaveAttempt}) to USER (${userIdForSave}) since save was scheduled. Proceeding with user save for ${userIdForSave}.`);
        }
        
        console.log(
          `[KanbanProvider] Attempting to save for authenticated user ${userIdForSave} (confirmed by CLIENT-SIDE SDK). Tasks: ${state.tasks.length}, Columns: ${state.columns.length}`
        );
        try {
          const sanitizedTasksForFirestore: TaskForFirestore[] = state.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            columnId: task.columnId,
            dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
            createdAt: formatISO(task.createdAt),
            updatedAt: formatISO(task.updatedAt),
            subtasks: (task.subtasks || []).map(st => ({ id: st.id, title: st.title, completed: st.completed })),
            recurrenceRule: task.recurrenceRule ? { type: task.recurrenceRule.type } : undefined,
            priority: task.priority,
            tags: task.tags || [],
            dependencies: task.dependencies || [],
            timerActive: typeof task.timerActive === 'boolean' ? task.timerActive : false,
            timeSpentSeconds: typeof task.timeSpentSeconds === 'number' ? task.timeSpentSeconds : 0,
            timerStartTime: typeof task.timerStartTime === 'number' ? task.timerStartTime : null,
          }));

          const sanitizedColumnsForFirestore: ColumnForFirestore[] = state.columns.map(col => ({
            id: col.id,
            title: col.title,
            taskIds: col.taskIds || [],
          }));
          await saveUserKanbanData(userIdForSave, sanitizedTasksForFirestore, sanitizedColumnsForFirestore); 
          console.log(`[KanbanProvider] Successfully saved data via server action for user ${userIdForSave}`);
        } catch (error: any) { 
            console.error(`[KanbanProvider] Error CAUGHT from saveUserKanbanData (Server Action) for user ${userIdForSave}:`, error.message);
            if (error.message && error.message.startsWith('Firestore permission denied')) {
                handlePermissionDeniedError('save', error.message);
            } else if (error.message && error.message.toLowerCase().includes('invalid user id parameter')) {
                 toast({ title: "Save Error", description: `Internal Error: ${error.message}`, variant: "destructive" });
            } else {
                toast({ title: "Save Error", description: `Failed to save tasks to cloud. Detail: ${error.message || 'Unknown error from kanban-service.'}`, variant: "destructive" });
            }
        }
      } else if (guestForSaveAttempt) { 
        if (userForSaveAttempt) { 
             console.warn(`[KanbanProvider] Debounced SAVE SKIPPED for GUEST ${guestForSaveAttempt}: User ${userForSaveAttempt.uid} was active at schedule, but SDK user is now null. Not saving guest data over potential user session loss/logout.`);
        } else { 
            console.log(`[KanbanProvider] Debounced SAVE: Guest user mode (Guest ID ref: ${guestForSaveAttempt}). Saving to localStorage. Tasks: ${state.tasks.length}`);
            if (typeof window !== 'undefined') {
                try {
                    const tasksToSaveForGuest = state.tasks.map(task => ({
                        ...task,
                        dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
                        createdAt: formatISO(task.createdAt),
                        updatedAt: formatISO(task.updatedAt),
                        subtasks: (task.subtasks || []).map(st => ({ id: st.id, title: st.title, completed: st.completed })),
                        tags: task.tags || [],
                        dependencies: task.dependencies || [],
                    }));
                    localStorage.setItem(GUEST_TASKS_STORAGE_KEY, JSON.stringify(tasksToSaveForGuest));

                    const columnsStateToSaveForGuest = state.columns.map(col => ({
                        id: col.id,
                        title: col.title,
                        taskIds: col.taskIds || [],
                    }));
                    localStorage.setItem(GUEST_COLUMNS_STORAGE_KEY, JSON.stringify(columnsStateToSaveForGuest));
                    console.log("[KanbanProvider] Successfully saved guest data to localStorage.");
                } catch(e: any) {
                    console.error("[KanbanProvider] Failed to save guest data to localStorage:", e);
                    toast({ title: "Local Save Error", description: "Could not save tasks to your browser's storage.", variant: "destructive" });
                }
            }
        }
      } else { 
        console.warn(
          `[KanbanProvider] Debounced SAVE SKIPPED (TIMEOUT EXECUTION): No valid authenticated user (CLIENT-SIDE SDK check null) and no guest ID (ref). Data not saved.`
        );
        toast({ title: "Save Error", description: "Save aborted: User is not signed in (client-side check). Please log in.", variant: "destructive" });
      }
    }, 1500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [
    state.tasks,
    state.columns,
    state.isDataInitialized,
    authContextUser, 
    authContextGuestId, 
    authLoading, 
    dispatch,
    toast,
    handlePermissionDeniedError,
  ]);


  return <KanbanContext.Provider value={{ state, dispatch }}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

    