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
      blocked(currentVersion, blockedVersion, event) {
        console.warn('IndexedDB upgrade blocked. Please close other tabs of this site.', currentVersion, blockedVersion);
      },
      blocking() {
        if (dbPromise) {
          dbPromise.then(db => db.close());
        }
      }
    }).catch(err => {
      console.error("Failed to open IndexedDB:", err);
      // Giả lập một DB dummy rỗng để các hàm tiếp theo không bị crash nếu IDB lỗi hoàn toàn
      throw err;
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
  const arrayBuffer = await audioBlob.arrayBuffer();
  // Lưu dưới dạng object chứa buffer và type để reconstruct lại chính xác
  await db.put(STUDENT_STORE, { buffer: arrayBuffer, type: audioBlob.type }, id);
}

export async function getStudentAudio(id: string): Promise<Blob | null> {
  const db = await getDB();
  const data = await db.get(STUDENT_STORE, id);
  if (!data) return null;

  // Hỗ trợ cả định dạng cũ (lưu trực tiếp blob) và định dạng mới (arrayBuffer + type)
  if (data instanceof Blob) {
    return data;
  }

  if (data.buffer && data.type) {
    return new Blob([data.buffer], { type: data.type });
  }

  return null;
}
