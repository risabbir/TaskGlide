
'use server';
/**
 * @fileOverview Firestore service for managing Kanban board data for authenticated users.
 */
import { db, auth as firebaseAuth } from '@/lib/firebase'; // Import firebaseAuth for SDK check
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
  priority: PRIORITIES.includes(taskData.priority as Priority) ? taskData.priority as Priority : 'medium', // Validate priority
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
  if (!userId || typeof userId !== 'string' || userId.trim() === '' || !currentSdkUser || currentSdkUser.uid !== userId) {
    console.error(`[KanbanService] getUserKanbanData critical error: Invalid state. Service UserID: ${userId}, SDK UserID: ${currentSdkUser?.uid}. Aborting fetch.`);
    // Do not throw here, let the caller (KanbanProvider) handle it.
    return null;
  }

  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to GET doc: ${docPath} for user: ${userId}`);
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
      console.log(`[KanbanService] Successfully fetched Kanban data from ${docPath} for user: ${userId}`);
      return { tasks, columns };
    }
    console.log(`[KanbanService] No Kanban data found at ${docPath} for user: ${userId}. Returning default structure.`);
    return {
        tasks: [],
        columns: DEFAULT_COLUMNS.map(col => ({ ...col, taskIds: [] })),
    };
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in GET operation for ${docPath} (User: ${userId}):`, error.message, error.code, error);
    // Re-throw the error so the caller (KanbanProvider) can handle it, e.g., by setting an error state.
    throw error; // Make sure KanbanProvider catches this.
  }
}

export async function saveUserKanbanData(
  userId: string,
  tasks: TaskForFirestore[],
  columns: ColumnForFirestore[]
): Promise<void> {
  const currentSdkUser = firebaseAuth.currentUser;
  if (!userId || typeof userId !== 'string' || userId.trim() === '' || !currentSdkUser || currentSdkUser.uid !== userId) {
    console.error(`[KanbanService] saveUserKanbanData critical error: Invalid state. Service UserID: ${userId}, SDK UserID: ${currentSdkUser?.uid}. Aborting save.`);
    // Do not throw here, let the caller (KanbanProvider) handle it.
    return;
  }

  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to SET doc: ${docPath} for user: ${userId}`);
  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const dataToSave: UserKanbanDataFromFirestore = { // Explicitly type dataToSave
      tasks: tasks,
      columns: columns,
      firestoreLastUpdated: serverTimestamp() as Timestamp, // serverTimestamp returns a sentinel
    };
    await setDoc(docRef, dataToSave);
    console.log(`[KanbanService] Successfully saved Kanban data for ${docPath} (User: ${userId})`);
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in SET operation for ${docPath} (User: ${userId}):`, error.message, error.code, error);
    throw error; // Make sure KanbanProvider catches this.
  }
}
