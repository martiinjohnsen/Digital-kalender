import { parseBackup, type AppData } from "./model.ts";
import { containsPrivateMedia } from "./media-reference.ts";
const DATABASE = "luke-advent";
const STORE = "workspace";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Lukk andre faner med Luke og prøv igjen."));
  });
}
// Only this adapter needs replacing when a server-backed account is added.
export const repository = {
  async load(key = "data"): Promise<AppData | null> {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = db
          .transaction(STORE, "readonly")
          .objectStore(STORE)
          .get(key);
        request.onsuccess = () => {
          if (request.result === undefined) resolve(null);
          else {
            try {
              resolve(parseBackup(JSON.stringify(request.result)));
            } catch (error) {
              reject(error);
            }
          }
        };
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  },
  async save(data: AppData, key = "data"): Promise<void> {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).put(data, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  },
};
// Separate keys prevent one account from loading another account's draft.
// The guest workspace is preserved until its owner explicitly imports it.
export async function loadRecord<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function saveRecord(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function downloadJson(value: unknown, filename: string): Promise<void> {
  if (containsPrivateMedia(value)) {
    const { supabase } = await import('./cloud/client');
    const { portableMediaCopy } = await import('./cloud/media');
    const { data,error } = await supabase().auth.getSession();
    if (error || !data.session) throw new Error('Logg inn og koble til nettet for å hente vedleggene i sikkerhetskopien.');
    value = await portableMediaCopy(value,data.session.user.id);
  }
  const text=JSON.stringify(value,null,2);
  if(text.length>100000000) throw new Error('Sikkerhetskopien er større enn 100 MB. Last ned én kalender om gangen.');
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function compressImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Velg et bilde i JPG-, PNG- eller WebP-format.");
  if (file.size > 20000000) throw new Error("Bildet må være mindre enn 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Nettleseren kunne ikke behandle bildet.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.78);
    if (result.length > 800000)
      throw new Error("Bildet er for detaljert. Prøv et mindre bilde.");
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
