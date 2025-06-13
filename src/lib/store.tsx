
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

      if (taskToMove.timerActive && oldColumnId === 'inprogress' && newColumnId !== 'inprogress' && taskToMove.timerStartTime) {
        const elapsed = Math.floor((Date.now() - taskToMove.timerStartTime) / 1000);
        finalTimeSpentSeconds += elapsed;
        finalTimerActive = false;
        finalTimerStartTime = null;
      }
      else if (taskToMove.timerActive && (newColumnId === 'done' || newColumnId === 'review') && taskToMove.timerStartTime) {
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
  const { user: authContextUser, loading: authLoading, guestId: authContextGuestId } = useAuth();
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);
  
  const authUserRef = useRef(authContextUser);
  const guestIdRef = useRef(authContextGuestId);
  const lastAuthIdentifierRef = useRef<string | null>(null); // Stores the last active identifier (UID or GuestID)

  useEffect(() => {
    authUserRef.current = authContextUser;
  }, [authContextUser]);

  useEffect(() => {
    guestIdRef.current = authContextGuestId;
  }, [authContextGuestId]);


  const handlePermissionDeniedError = useCallback((operation: string, path: string, error: any, contextUserId?: string | null, sdkUserId?: string | null, sdkUserEmail?: string | null) => {
    const configuredProjectIdInEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET (Check .env!)';
    const expectedRule = `// Firestore Rule for path '${path}':\nmatch /${path.split('/')[0]}/{userId} {\n  allow read, write: if request.auth != null && request.auth.uid == userId;\n}`;
    
    const detailedMessage = `Could not ${operation} board data for path "${path}". This is likely due to Firestore security rules. (Error: ${error.code || 'UNKNOWN'} - ${error.message})
    \n➡️ App's Configured Firebase Project ID (from .env): ${configuredProjectIdInEnv}
    \n🔑 Context User ID (attempted operation for): ${contextUserId || 'N/A'}
    \n🕵️ Firebase SDK Authenticated User ID (at time of error): ${sdkUserId || 'N/A'} (Email: ${sdkUserEmail || 'N/A'})
    \n\n📋 Expected Firestore Rule for this path:
    ${expectedRule}
    \n\n🔥 ACTION REQUIRED:
    1. Go to Firebase Console -> Firestore Database -> Rules.
    2. Verify the Project ID in your browser's URL EXACTLY matches the "App's Configured Firebase Project ID" logged above.
    3. Ensure the Firestore rules are EXACTLY as specified in README.md and are PUBLISHED.
    4. If rules and Project ID match, verify the "SDK Authenticated User ID" above is what you expect and matches the "Context User ID".`;

    console.error(`[KanbanProvider] DETAILED PERMISSION_DENIED: Operation: ${operation}, Path: ${path}, ContextUID: ${contextUserId}, SdkUID: ${sdkUserId}, SdkEmail: ${sdkUserEmail}, Configured Project ID: ${configuredProjectIdInEnv}, Error:`, error);
    dispatch({ type: "SET_ERROR", payload: `Failed to ${operation} board data due to permissions.` });
    toast({
      title: `Board Data Access Error (${operation}) - PERMISSION_DENIED`,
      description: detailedMessage,
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

    if (contextUserAtLoadTime?.uid === identifierToLoad) { // User mode
      const userIdToLoad = contextUserAtLoadTime.uid;
      const currentSdkUser = firebaseAuthInstance.currentUser; // Fresh SDK check
      if (!currentSdkUser || currentSdkUser.uid !== userIdToLoad) {
        console.error(`[KanbanProvider] loadData: SDK user mismatch or null during user data load. SDK User: ${currentSdkUser?.uid}, Expected: ${userIdToLoad}. Aborting Firestore load.`);
        dispatch({ type: "SET_ERROR", payload: "Authentication state error during data load." });
        dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
        return;
      }
      console.log(`[KanbanProvider] loadData: Logged-in user mode (UID: ${userIdToLoad}). Fetching from Firestore.`);
      try {
        const firestoreData = await getUserKanbanData(userIdToLoad);
        if (isMounted.current) {
          if (firestoreData) {
            dispatch({ type: "SET_INITIAL_DATA", payload: firestoreData });
          } else {
            dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
          }
        }
      } catch (error: any) {
        console.error(`[KanbanProvider] loadData: Firestore error for user ${userIdToLoad}:`, error);
        if (isMounted.current) {
          if (error.code === 'permission-denied' || error.code === 7) {
            handlePermissionDeniedError('load', `userKanbanData/${userIdToLoad}`, error, userIdToLoad, currentSdkUser?.uid, currentSdkUser?.email);
          } else {
            dispatch({ type: "SET_ERROR", payload: "Failed to load tasks from cloud." });
          }
          dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });
        }
      }
    } else if (guestIdAtLoadTime === identifierToLoad) { // Guest mode
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
      console.warn(`[KanbanProvider] loadData: Identifier '${identifierToLoad}' does not match current contextUser or guestId. This should not happen if called correctly. Aborting specific load.`);
      dispatch({ type: "SET_LOADING", payload: false });
      if (!state.isDataInitialized) dispatch({ type: "SET_DATA_INITIALIZED", payload: true }); // Mark as initialized to prevent reload loops for this invalid state
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, handlePermissionDeniedError, state.isLoading]); // Removed state.isDataInitialized as it's managed by the calling effect

  useEffect(() => {
    isMounted.current = true;
    const currentAuthContextUser = authUserRef.current;
    const currentGuestId = guestIdRef.current;
    const activeIdentifier = currentAuthContextUser?.uid || currentGuestId;

    console.log(`[KanbanProvider] AuthEffect | AuthLoading: ${authLoading}, ActiveIdentifier(refs): ${activeIdentifier}, LastIdentifier: ${lastAuthIdentifierRef.current}, State.isLoading: ${state.isLoading}, State.isDataInitialized: ${state.isDataInitialized}`);

    if (authLoading) {
      console.log("[KanbanProvider] AuthEffect: Auth is loading. Waiting...");
      if (!state.isLoading) dispatch({ type: "SET_LOADING", payload: true });
      return;
    }

    if (activeIdentifier !== lastAuthIdentifierRef.current) {
      console.log(`[KanbanProvider] AuthEffect: Identifier CHANGED. Prev: ${lastAuthIdentifierRef.current}, New: ${activeIdentifier}. Resetting Kanban state.`);
      lastAuthIdentifierRef.current = activeIdentifier;
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_DATA_INITIALIZED", payload: false });
      dispatch({ type: "SET_INITIAL_DATA", payload: { tasks: [], columns: DEFAULT_COLUMNS.map(c => ({ ...c, taskIds: [] })) } });

      if (activeIdentifier) {
        console.log(`[KanbanProvider] AuthEffect: New active identifier '${activeIdentifier}'. Initiating data load.`);
        loadData(activeIdentifier, currentAuthContextUser, currentGuestId);
      } else {
        console.log("[KanbanProvider] AuthEffect: No active identifier (user signed out, no guest). State is clean.");
        dispatch({ type: "SET_LOADING", payload: false });
        dispatch({ type: "SET_DATA_INITIALIZED", payload: true });
      }
    } else if (activeIdentifier && !state.isDataInitialized && !state.isLoading) {
      console.log(`[KanbanProvider] AuthEffect: Identifier '${activeIdentifier}' same, data not initialized, not loading. Retrying load.`);
      dispatch({ type: "SET_LOADING", payload: true });
      loadData(activeIdentifier, currentAuthContextUser, currentGuestId);
    } else if (!activeIdentifier && state.isLoading) {
      // If authLoading is false, and no active identifier, but provider is still loading, set to false.
      console.log(`[KanbanProvider] AuthEffect: No active identifier, and authLoading is false, but provider state.isLoading is true. Setting to false.`);
      dispatch({ type: "SET_LOADING", payload: false });
      if(!state.isDataInitialized) dispatch({ type: "SET_DATA_INITIALIZED", payload: true }); // Consider empty state as initialized
    } else if (activeIdentifier && state.isDataInitialized && state.isLoading) {
      // If data is initialized for the current identifier, but isLoading is still true, set it to false.
      console.log(`[KanbanProvider] AuthEffect: Identifier '${activeIdentifier}' same, data initialized, but state.isLoading is true. Setting to false.`);
       dispatch({ type: "SET_LOADING", payload: false });
    }


    return () => {
      // isMounted.current = false; // Global unmount is handled in a separate effect
    };
  }, [authContextUser, authContextGuestId, authLoading, dispatch, loadData, state.isDataInitialized, state.isLoading, handlePermissionDeniedError]);


  useEffect(() => {
    return () => { // This is the global unmount cleanup
      isMounted.current = false;
      console.log("[KanbanProvider] Unmounted globally.");
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!isMounted.current || authLoading || !state.isDataInitialized) {
      console.log(`[KanbanProvider] Debounced Save effect SKIPPED (initial check): isMounted=${isMounted.current}, authLoading=${authLoading}, isDataInitialized=${state.isDataInitialized}`);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current || !state.isDataInitialized) {
        console.log("[KanbanProvider] Debounced save SKIPPED post-timeout: Component unmounted or data not initialized for current auth identifier.");
        return;
      }

      const userAtSaveTime = authUserRef.current;
      const sdkUserAtSaveTime = firebaseAuthInstance.currentUser;
      const guestIdAtSaveTime = guestIdRef.current;

      console.log(`[KanbanProvider] Debounced Save TIMEOUT EXECUTING. Context User (ref): ${userAtSaveTime?.uid}, Guest ID (ref): ${guestIdAtSaveTime}, SDK User: ${sdkUserAtSaveTime?.uid} (Email: ${sdkUserAtSaveTime?.email}), Tasks: ${state.tasks.length}`);

      if (userAtSaveTime && sdkUserAtSaveTime && userAtSaveTime.uid === sdkUserAtSaveTime.uid) {
        const userIdForSave = sdkUserAtSaveTime.uid;
        console.log(`[KanbanProvider] Attempting to save for user ${userIdForSave}. Tasks: ${state.tasks.length}, Columns: ${state.columns.length}`);
        try {
          const sanitizedTasksForFirestore: TaskForFirestore[] = state.tasks.map(task => ({
            ...task,
            dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
            createdAt: formatISO(task.createdAt),
            updatedAt: formatISO(task.updatedAt),
            subtasks: task.subtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed })),
            recurrenceRule: task.recurrenceRule ? { type: task.recurrenceRule.type } : undefined,
            priority: task.priority,
          }));

          const sanitizedColumnsForFirestore: ColumnForFirestore[] = state.columns.map(col => ({
            id: col.id,
            title: col.title,
            taskIds: col.taskIds,
          }));

          await saveUserKanbanData(userIdForSave, sanitizedTasksForFirestore, sanitizedColumnsForFirestore);
          console.log(`[KanbanProvider] Successfully saved data to Firestore for user ${userIdForSave}`);
        } catch (error: any) {
          console.error(`[KanbanProvider] Failed to save data to Firestore for user ${userIdForSave}:`, error.message, error.code, error);
          if (error.code === 'permission-denied' || error.code === 7) {
            handlePermissionDeniedError('save', `userKanbanData/${userIdForSave}`, error, userIdForSave, sdkUserAtSaveTime?.uid, sdkUserAtSaveTime?.email);
          } else if (error.message && error.message.includes("Invalid user ID")) { // Error from saveUserKanbanData itself
             toast({ title: "Save Error", description: `Save aborted: ${error.message}`, variant: "destructive" });
          } else {
            toast({ title: "Save Error", description: `Failed to save tasks to cloud. Error: ${error.message}`, variant: "destructive" });
          }
        }
      } else if (guestIdAtSaveTime) {
        console.log(`[KanbanProvider] Debounced SAVE: Guest user mode (Guest ID ref: ${guestIdAtSaveTime}). Saving to localStorage. Tasks: ${state.tasks.length}`);
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
      } else {
         console.warn(`[KanbanProvider] Debounced SAVE SKIPPED (TIMEOUT EXECUTION): No valid authenticated user (Context User ref UID: ${userAtSaveTime?.uid}, SDK UID: ${sdkUserAtSaveTime?.uid}) and no guest ID (ref). Data not saved.`);
      }
    }, 1500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [state.tasks, state.columns, authLoading, dispatch, toast, handlePermissionDeniedError, state.isDataInitialized]);


  return <KanbanContext.Provider value={{ state, dispatch }}>{children}</KanbanContext.Provider>;
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

    
