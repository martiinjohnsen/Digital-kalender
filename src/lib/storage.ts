import { parseBackup, type AppData } from "./model.ts";
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
  async load(): Promise<AppData | null> {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = db
          .transaction(STORE, "readonly")
          .objectStore(STORE)
          .get("data");
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
  async save(data: AppData): Promise<void> {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).put(data, "data");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  },
};
export function downloadJson(value: unknown, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
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
