
'use server';
/**
 * @fileOverview Firestore service for managing Kanban board data for authenticated users.
 */
import { db } from '@/lib/firebase';
import type { Task, Column as ColumnType } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { formatISO, parseISO as dateFnsParseISO } from 'date-fns';
import { DEFAULT_COLUMNS } from '@/lib/constants'; // For default column structure

// Helper to parse dates when fetching from Firestore
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
  subtasks: taskData.subtasks || [],
  dependencies: taskData.dependencies || [],
  tags: taskData.tags || [],
  timerActive: taskData.timerActive === undefined ? false : taskData.timerActive,
  timeSpentSeconds: taskData.timeSpentSeconds === undefined ? 0 : taskData.timeSpentSeconds,
  timerStartTime: taskData.timerStartTime === undefined ? null : taskData.timerStartTime,
});


interface UserKanbanData {
  tasks: Task[];
  columns: Array<Pick<ColumnType, 'id' | 'title' | 'taskIds'>>; 
  firestoreLastUpdated?: Timestamp;
}

export async function getUserKanbanData(userId: string): Promise<UserKanbanData | null> {
  if (!userId) {
    console.warn("[KanbanService] getUserKanbanData called with no userId.");
    return null;
  }
  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to GET doc: ${docPath}`);
  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const tasks = (data.tasks || []).map(parseTaskFromFirestore);
      const columns = DEFAULT_COLUMNS.map(defaultCol => {
        const storedCol = (data.columns || []).find((c: any) => c.id === defaultCol.id);
        return {
          ...defaultCol,
          title: storedCol?.title || defaultCol.title,
          taskIds: storedCol ? storedCol.taskIds : [],
        };
      });
      console.log(`[KanbanService] Successfully fetched Kanban data from ${docPath}`);
      return { tasks, columns, firestoreLastUpdated: data.firestoreLastUpdated };
    }
    console.log(`[KanbanService] No Kanban data found at ${docPath}. Returning default structure.`);
    return {
        tasks: [],
        columns: DEFAULT_COLUMNS.map(col => ({ id: col.id, title: col.title, taskIds: [] })), // Return plain objects for columns
        firestoreLastUpdated: undefined
    };
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in GET operation for ${docPath}:`, error.message, error.code, error);
    throw error;
  }
}

export async function saveUserKanbanData(
  userId: string,
  tasks: Task[],
  columns: ColumnType[]
): Promise<void> {
  if (!userId) {
    console.warn("[KanbanService] saveUserKanbanData called with no userId.");
    return;
  }
  const docPath = `userKanbanData/${userId}`;
  console.log(`[KanbanService] Attempting to SET doc: ${docPath}`);
  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const tasksToSave = tasks.map(task => ({
      ...task,
      dueDate: task.dueDate ? formatISO(task.dueDate) : undefined,
      createdAt: formatISO(task.createdAt),
      updatedAt: formatISO(task.updatedAt),
    }));
    const columnsToSave = columns.map(col => ({
      id: col.id,
      title: col.title,
      taskIds: col.taskIds,
    }));

    const dataToSave = {
      tasks: tasksToSave,
      columns: columnsToSave,
      firestoreLastUpdated: serverTimestamp(),
    };
    // console.log(`[KanbanService] Data being sent to Firestore for ${docPath}:`, JSON.stringify(dataToSave, null, 2)); // Deep log data
    await setDoc(docRef, dataToSave);
    console.log(`[KanbanService] Successfully saved Kanban data for ${docPath}`);
  } catch (error: any) {
    console.error(`[KanbanService] Firestore error in SET operation for ${docPath}:`, error.message, error.code, error);
    throw error;
  }
}
