import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'TeacherAudioDB';
const TEACHER_STORE = 'custom-recordings';
const STUDENT_STORE = 'student-recordings';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(TEACHER_STORE);
        }
        if (oldVersion < 2) {
          db.createObjectStore(STUDENT_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveCustomAudio(id: string, audioBlob: Blob) {
  const db = await getDB();
  await db.put(TEACHER_STORE, audioBlob, id);
}

export async function getCustomAudio(id: string): Promise<Blob | null> {
  const db = await getDB();
  return await db.get(TEACHER_STORE, id);
}

export async function deleteCustomAudio(id: string) {
  const db = await getDB();
  await db.delete(TEACHER_STORE, id);
}

export async function saveStudentAudio(id: string, audioBlob: Blob) {
  const db = await getDB();
  await db.put(STUDENT_STORE, audioBlob, id);
}

export async function getStudentAudio(id: string): Promise<Blob | null> {
  const db = await getDB();
  return await db.get(STUDENT_STORE, id);
}
