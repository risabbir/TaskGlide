
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
  subtasks: (taskData.subtasks || []).map((st: any) => ({ id: st.id, title: st.title, completed: !!st.completed })),
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
  
  const sdkCurrentUserInServerAction = firebaseAuth.currentUser;
  console.log(
    `[KanbanService] getUserKanbanData (Server Action) CALLED for context userId (param): ${userId}. ` +
    `SDK currentUser in ServerAction context (at call time): ${sdkCurrentUserInServerAction?.uid} (Email: ${sdkCurrentUserInServerAction?.email}). ` +
    `Configured Project ID: ${configuredProjectId}`
  );

  if (!userId || typeof userId !== 'string' || userId.trim() === '' ) {
    console.error(`[KanbanService] getUserKanbanData (Server Action) ERROR: Invalid context userId (param) provided: '${userId}'. Aborting.`);
    throw new Error(`Invalid user ID parameter provided to getUserKanbanData: '${userId}'.`);
  }
  
  if (!sdkCurrentUserInServerAction) {
    console.warn(`[KanbanService] getUserKanbanData (Server Action) DIAGNOSTIC: SDK currentUser is NULL in ServerAction context when called for userId (param) '${userId}'.`);
  } else if (sdkCurrentUserInServerAction.uid !== userId) {
    console.warn(
      `[KanbanService] getUserKanbanData (Server Action) DIAGNOSTIC: Mismatch between intended userId (param '${userId}') and SDK currentUser in ServerAction context ('${sdkCurrentUserInServerAction.uid}').`
    );
  }

  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to GET doc from path: "${docPath}" in project "${configuredProjectId}" for user (param): ${userId}.`);
  
  try {
    const docRef = doc(db, 'userKanbanData', userId);
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
      console.log(`[KanbanService] Successfully fetched Kanban data from ${docPath} for user (param): ${userId} (Operation took ${Date.now() - functionStartTime}ms). Tasks: ${tasks.length}, Columns: ${columns.length}`);
      return { tasks, columns };
    }
    
    console.log(`[KanbanService] No Kanban data found at ${docPath} for user (param): ${userId}. Returning default structure. (Operation took ${Date.now() - functionStartTime}ms)`);
    return {
        tasks: [],
        columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })),
    };
  } catch (error: any) {
    const sdkAuthUidAtError = firebaseAuth.currentUser?.uid; 
    console.error(
      `[KanbanService] Firestore error in GET operation for path "${docPath}" (User param: ${userId}, Project: ${configuredProjectId}, Took: ${Date.now() - functionStartTime}ms). ` +
      `SDK User in ServerAction context (AT ERROR TIME): ${sdkAuthUidAtError}. Error:`, error.message, error.code, error
    );

    if (error.code === 'permission-denied' || error.code === 7 || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      throw new Error(
        `Firestore permission denied for user '${userId}' on path '${docPath}' during read. ` +
        `SDK auth state in server action (at error time) was: ${sdkAuthUidAtError ? `'${sdkAuthUidAtError}'` : 'null'}. ` +
        `(Original Firestore code: ${error.code || 'N/A'})`
      );
    }
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
  
  const sdkCurrentUserInServerAction = firebaseAuth.currentUser; 
  console.log(
    `[KanbanService] saveUserKanbanData (Server Action) CALLED for intended userId (param): ${userId}. ` +
    `SDK currentUser in ServerAction context (at call time): ${sdkCurrentUserInServerAction?.uid} (Email: ${sdkCurrentUserInServerAction?.email}). ` +
    `Configured Project ID: ${configuredProjectId}. Tasks: ${tasks.length}, Cols: ${columns.length}.`
  );

  if (!userId || typeof userId !== 'string' || userId.trim() === '' ) {
    console.error(`[KanbanService] saveUserKanbanData (Server Action) ERROR: Invalid 'userId' parameter received: '${userId}'. Aborting save.`);
    throw new Error(`Invalid user ID parameter provided to saveUserKanbanData: '${userId}'.`);
  }

  if (!sdkCurrentUserInServerAction) {
    console.warn(`[KanbanService] saveUserKanbanData (Server Action) DIAGNOSTIC: SDK currentUser is NULL in ServerAction context when called for userId (param) '${userId}'.`);
  } else if (sdkCurrentUserInServerAction.uid !== userId) {
    console.warn(
      `[KanbanService] saveUserKanbanData (Server Action) DIAGNOSTIC: Mismatch between intended userId (param '${userId}') and SDK currentUser in ServerAction context ('${sdkCurrentUserInServerAction.uid}').`
    );
  }

  const docPath = `userKanbanData/${userId}`; 
  console.log(`[KanbanService] Attempting to SET doc to path: "${docPath}" in project "${configuredProjectId}" for user (param): ${userId}.`);

  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const dataToSave: UserKanbanDataFromFirestore = { 
      tasks: tasks,
      columns: columns,
      firestoreLastUpdated: serverTimestamp() as Timestamp,
    };
    await setDoc(docRef, dataToSave);
    console.log(`[KanbanService] Successfully SET doc for path "${docPath}" (User param: ${userId}, Operation took ${Date.now() - functionStartTime}ms)`);
  } catch (error: any) {
    const sdkAuthUidAtError = firebaseAuth.currentUser?.uid; 
    console.error(
      `[KanbanService] Firestore error in SET operation for path "${docPath}" (User param: ${userId}, Project: ${configuredProjectId}, Took ${Date.now() - functionStartTime}ms). ` +
      `SDK User in ServerAction context (AT ERROR TIME): ${sdkAuthUidAtError}. Error:`, error.message, error.code, error
    );

    if (error.code === 'permission-denied' || error.code === 7 || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      throw new Error(
        `Firestore permission denied for user '${userId}' on path '${docPath}' during write. ` +
        `SDK auth state in server action (at error time) was: ${sdkAuthUidAtError ? `'${sdkAuthUidAtError}'` : 'null'}. ` +
        `(Original Firestore code: ${error.code || 'N/A'})`
      );
    }
    throw error;
  }
}
    