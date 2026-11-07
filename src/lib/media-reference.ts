export const MEDIA_BUCKET = "luke-media";
export const MAX_AUDIO_SECONDS = 180;
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
export type MediaScope = "door" | "reply";
const pathPattern = /^([A-Za-z0-9-]{1,80})\/(door|reply)\/([1-9]|1[0-9]|2[0-4])\/([a-f0-9-]{36})\/([a-f0-9]{64})\.(jpg|png|webp|m4a|webm|ogg|mp3|wav)$/;
export function mediaPath(value: string | undefined): string | null {
  if (!value?.startsWith("luke-media:")) return null;
  const path = value.slice(11);
  return pathPattern.test(path) ? path : null;
}
export function mediaReference(path: string): string {
  if (!pathPattern.test(path)) throw new Error("Ugyldig mediefil.");
  return `luke-media:${path}`;
}
export function isImageSource(value: unknown): value is string {
  return typeof value === "string" && (value === "" ||
    (value.length <= 800000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) ||
    (!!mediaPath(value) && /\.(jpg|png|webp)$/.test(value)));
}
export function isAudioSource(value: unknown): value is string {
  return typeof value === "string" && (value === "" ||
    (value.length <= 11200000 && /^data:audio\/(mp4|webm|ogg|mpeg|wav);base64,[A-Za-z0-9+/=]+$/.test(value)) ||
    (!!mediaPath(value) && /\.(m4a|webm|ogg|mp3|wav)$/.test(value)));
}
export function mediaBelongsTo(value: string, calendarId: string, day: number, scope: MediaScope): boolean {
  return mediaPath(value)?.startsWith(`${calendarId}/${scope}/${day}/`) ?? false;
}
export function containsPrivateMedia(value:unknown):boolean {
  if(typeof value==="string") return !!mediaPath(value);
  if(Array.isArray(value)) return value.some(containsPrivateMedia);
  return !!value && typeof value==="object" && Object.values(value).some(containsPrivateMedia);
}
