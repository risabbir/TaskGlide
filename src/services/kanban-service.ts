
'use server';
/**
 * @fileOverview Firestore service for managing Kanban board data for authenticated users.
 */
import { db, auth as firebaseAuth } from '@/lib/firebase';
import type { Task, Column as ColumnType, TaskForFirestore, ColumnForFirestore, Priority } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { formatISO, parseISO as dateFnsParseISO } from 'date-fns';
import { DEFAULT_COLUMNS, PRIORITIES } from '@/lib/constants';

const parseTaskDateFromFirestore = (dateValue?: string | Date | Timestamp): Date | undefined => {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;
  if (dateValue instanceof Timestamp) return dateValue.toDate();
  if (typeof dateValue === 'string') {
    try {
      const parsed = dateFnsParseISO(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch (e) { /* ignore parse error, try number */ }
  }
  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && !isNaN(Number(dateValue)))) {
    const numDate = new Date(Number(dateValue));
    if (!isNaN(numDate.getTime())) return numDate;
  }
  console.warn(`[KanbanService] parseTaskDateFromFirestore: Could not parse date value:`, dateValue);
  return undefined;
};

const parseTaskFromFirestore = (taskData: any): Task => ({
  ...taskData,
  dueDate: parseTaskDateFromFirestore(taskData.dueDate),
  createdAt: parseTaskDateFromFirestore(taskData.createdAt) || new Date(),
  updatedAt: parseTaskDateFromFirestore(taskData.updatedAt) || new Date(),
  priority: PRIORITIES.includes(taskData.priority as Priority) ? taskData.priority as Priority : 'medium',
  subtasks: taskData.subtasks || [],
  dependencies: taskData.dependencies || [],
  tags: taskData.tags || [],
  timerActive: taskData.timerActive === undefined ? false : taskData.timerActive,
  timeSpentSeconds: taskData.timeSpentSeconds === undefined ? 0 : taskData.timeSpentSeconds,
  timerStartTime: taskData.timerStartTime === undefined ? null : taskData.timerStartTime,
  recurrenceRule: taskData.recurrenceRule || undefined,
});

interface UserKanbanDataFromFirestore {
  tasks: TaskForFirestore[];
  columns: ColumnForFirestore[];
  firestoreLastUpdated?: Timestamp;
}

export async function getUserKanbanData(userId: string): Promise<{ tasks: Task[]; columns: ColumnType[] } | null> {
  const currentSdkUser = firebaseAuth.currentUser;
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT SET (Check .env!)";
  console.log(`[KanbanService] getUserKanbanData called for context userId: ${userId}. SDK currentUser: ${currentSdkUser?.uid}, SDK email: ${currentSdkUser?.email}. Configured Project ID: ${configuredProjectId}`);

  if (!userId || typeof userId !== 'string' || userId.trim() === '' ) {
    console.error(`[KanbanService] getUserKanbanData error: Invalid context userId provided: '${userId}'.`);
    return null;
  }
   if (!currentSdkUser) {
    console.error(`[KanbanService] getUserKanbanData error: Firebase SDK's currentUser is null at the time of load for context userId: ${userId}. User might have been signed out. Aborting load.`);
    return null;
  }
  if (currentSdkUser.uid !== userId) {
     console.error(`[KanbanService] getUserKanbanData critical error: Mismatch between context userId ('${userId}') and SDK currentUser.uid ('${currentSdkUser.uid}'). Aborting load.`);
     return null;
  }

  const docPath = `userKanbanData/${currentSdkUser.uid}`;
  console.log(`[KanbanService] Attempting to GET doc from path: "${docPath}" in project "${configuredProjectId}" for user: ${currentSdkUser.uid}`);
  try {
    const docRef = doc(db, 'userKanbanData', currentSdkUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserKanbanDataFromFirestore;
      const tasks: Task[] = (data.tasks || []).map(parseTaskFromFirestore);
      const columns: ColumnType[] = DEFAULT_COLUMNS.map(defaultCol => {
        const storedColData = (data.columns || []).find(c => c.id === defaultCol.id);
        return {
          ...defaultCol,
          title: storedColData?.title || defaultCol.title,
          taskIds: storedColData ? storedColData.taskIds.filter(taskId => tasks.some(t => t.id === taskId)) : (defaultCol.taskIds || []),
        };
      });
      console.log(`[KanbanService] Successfully fetched Kanban data from ${docPath} for user: ${currentSdkUser.uid}. Tasks: ${tasks.length}, Columns: ${columns.length}`);
      return { tasks, columns };
    }
    console.log(`[KanbanService] No Kanban data found at ${docPath} for user: ${currentSdkUser.uid}. Returning default structure.`);
    return {
        tasks: [],
        columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })),
    };
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in GET operation for path "${docPath}" (User: ${currentSdkUser.uid}, Project: ${configuredProjectId}):`, error.message, error.code, error);
    throw error;
  }
}

export async function saveUserKanbanData(
  userId: string,
  tasks: TaskForFirestore[],
  columns: ColumnForFirestore[]
): Promise<void> {
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT SET (Check .env!)";
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error(`[KanbanService] saveUserKanbanData error: Invalid userId passed from caller: '${userId}'. Aborting save.`);
    throw new Error("Invalid user ID provided to saveUserKanbanData by the calling function.");
  }

  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to SET doc to path: "${docPath}" in project "${configuredProjectId}" for user: ${userId}. Tasks count: ${tasks.length}, Columns count: ${columns.length}`);
  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const dataToSave: UserKanbanDataFromFirestore = {
      tasks: tasks,
      columns: columns,
      firestoreLastUpdated: serverTimestamp() as Timestamp,
    };
    await setDoc(docRef, dataToSave);
    console.log(`[KanbanService] Successfully saved Kanban data for path "${docPath}" (User: ${userId})`);
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in SET operation for path "${docPath}" (User: ${userId}, Project: ${configuredProjectId}):`, error.message, error.code, error);
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (error.code === 'permission-denied' || error.code === 7) {
        console.error(`[KanbanService] PERMISSION_DENIED saving to path ${docPath}. Ensure Firestore rules for project '${projectId || 'UNKNOWN (check .env)'}' allow write access for UID '${userId}'.`);
    }
    throw error;
  }
}
    
