import { readLocalProgress, type LocalProgress } from "./local-progress.ts";

export type PreviewProgress = {
  initialized: boolean;
  enabled: boolean;
  revision: number;
  test: LocalProgress;
  date: LocalProgress;
};
export const emptyPreviewProgress: PreviewProgress = {
  initialized: false, enabled: false, revision: 0,
  test: { opened: [], answers: {} }, date: { opened: [], answers: {} },
};

/** Read the existing keys exactly as before. Never remove a device's old copy. */
export function legacyPreviewProgress(storage: Pick<Storage, "getItem">, userId: string, calendarId: string, year: number) {
  const preferenceKey = `luke:preview-saving:${userId}:${calendarId}:${year}`;
  const base = `luke:progress:${userId}:${calendarId}:${year}`;
  const progressStorage = { getItem: storage.getItem.bind(storage), setItem: () => {} };
  return {
    marker: `${preferenceKey}:cloud-imported-v1`,
    alreadyImported: storage.getItem(`${preferenceKey}:cloud-imported-v1`) === "true",
    wasEnabled: storage.getItem(preferenceKey) === "true",
    test: readLocalProgress(progressStorage, `${base}:test`, true),
    date: readLocalProgress(progressStorage, `${base}:owner-date`, true),
  };
}
