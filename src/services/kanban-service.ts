
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
  const functionStartTime = Date.now();
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT SET (Check .env!)";
  console.log(`[KanbanService] getUserKanbanData CALLED for context userId: ${userId}. Configured Project ID: ${configuredProjectId}`);

  if (!userId || typeof userId !== 'string' || userId.trim() === '' ) {
    console.error(`[KanbanService] getUserKanbanData ERROR: Invalid context userId provided: '${userId}'. Aborting.`);
    return null;
  }

  const currentSdkUser = firebaseAuth.currentUser;
  if (!currentSdkUser) {
    console.error(`[KanbanService] getUserKanbanData CRITICAL CHECK FAILED: Firebase SDK currentUser is NULL when trying to get data for context userId: ${userId}. User might have been signed out. Aborting Firestore read.`);
    return null;
  }
  if (currentSdkUser.uid !== userId) {
     console.error(`[KanbanService] getUserKanbanData CRITICAL CHECK FAILED: Mismatch between context userId ('${userId}') and SDK currentUser.uid ('${currentSdkUser.uid}') just before Firestore read. Aborting.`);
     return null;
  }
  console.log(`[KanbanService] getUserKanbanData: SDK auth check PASSED for userId: ${userId} (SDK UID: ${currentSdkUser.uid}, Email: ${currentSdkUser.email}). Proceeding with Firestore read.`);

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
      console.log(`[KanbanService] Successfully fetched Kanban data from ${docPath} for user: ${currentSdkUser.uid} (Operation took ${Date.now() - functionStartTime}ms). Tasks: ${tasks.length}, Columns: ${columns.length}`);
      return { tasks, columns };
    }
    console.log(`[KanbanService] No Kanban data found at ${docPath} for user: ${currentSdkUser.uid}. Returning default structure. (Operation took ${Date.now() - functionStartTime}ms)`);
    return {
        tasks: [],
        columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })),
    };
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in GET operation for path "${docPath}" (User: ${currentSdkUser.uid}, Project: ${configuredProjectId}, Took: ${Date.now() - functionStartTime}ms):`, error.message, error.code, error);
    throw error;
  }
}

export async function saveUserKanbanData(
  userId: string, 
  tasks: TaskForFirestore[],
  columns: ColumnForFirestore[]
): Promise<void> {
  const functionStartTime = Date.now();
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT SET (Check .env!)";
  console.log(`[KanbanService] saveUserKanbanData CALLED for userId: ${userId}. Tasks: ${tasks.length}, Cols: ${columns.length}. Configured Project ID: ${configuredProjectId}`);

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error(`[KanbanService] saveUserKanbanData ERROR: Invalid userId parameter received from caller: '${userId}'. Aborting save.`);
    throw new Error("Invalid user ID provided to saveUserKanbanData by the calling function.");
  }

  const currentSdkUserAtSave = firebaseAuth.currentUser;

  if (!currentSdkUserAtSave) {
    console.warn(`[KanbanService] saveUserKanbanData WARNING: SDK currentUser is NULL in server action context when trying to save data for userId (passed from client): ${userId}. Proceeding with save attempt, relying on Firestore rules.`);
  } else if (currentSdkUserAtSave.uid !== userId) {
    console.warn(`[KanbanService] saveUserKanbanData WARNING: Mismatch between userId parameter ('${userId}') and SDK currentUser.uid ('${currentSdkUserAtSave.uid}') in server action context. Proceeding with save attempt using passed userId '${userId}', relying on Firestore rules.`);
  } else {
    console.log(`[KanbanService] saveUserKanbanData: SDK auth check confirmed user ${userId} (SDK UID: ${currentSdkUserAtSave.uid}, Email: ${currentSdkUserAtSave.email}) in server action context. Proceeding with Firestore write.`);
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
    console.log(`[KanbanService] Successfully saved Kanban data for path "${docPath}" (User: ${userId}, Operation took ${Date.now() - functionStartTime}ms)`);
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in SET operation for path "${docPath}" (User: ${userId}, Project: ${configuredProjectId}, Took ${Date.now() - functionStartTime}ms):`, error.message, error.code, error);
    if (error.code === 'permission-denied' || error.code === 7) {
        console.error(`[KanbanService] PERMISSION_DENIED saving to path ${docPath}. Ensure Firestore rules for project '${configuredProjectId}' allow write access for UID '${userId}'. Path was 'userKanbanData/${userId}'. Rule should be 'allow write: if request.auth != null && request.auth.uid == userId;'`);
    }
    throw error; 
  }
}
    
