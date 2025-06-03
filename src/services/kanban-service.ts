
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
  columns: Array<Pick<ColumnType, 'id' | 'title' | 'taskIds'>>; // Store only essential column data
  firestoreLastUpdated?: Timestamp;
}

export async function getUserKanbanData(userId: string): Promise<UserKanbanData | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'userKanbanData', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const tasks = (data.tasks || []).map(parseTaskFromFirestore);
      // Hydrate full column data from defaults, merging stored taskIds
      const columns = DEFAULT_COLUMNS.map(defaultCol => {
        const storedCol = (data.columns || []).find((c: any) => c.id === defaultCol.id);
        return {
          ...defaultCol, // Includes icon
          taskIds: storedCol ? storedCol.taskIds : [],
        };
      });
      return { tasks, columns, firestoreLastUpdated: data.firestoreLastUpdated };
    }
    return null; // No data for this user yet
  } catch (error) {
    console.error("Error fetching user Kanban data from Firestore:", error);
    throw error; // Or handle more gracefully
  }
}

export async function saveUserKanbanData(
  userId: string,
  tasks: Task[],
  columns: ColumnType[]
): Promise<void> {
  if (!userId) return;
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

    await setDoc(docRef, {
      tasks: tasksToSave,
      columns: columnsToSave,
      firestoreLastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving user Kanban data to Firestore:", error);
    throw error; // Or handle more gracefully
  }
}
