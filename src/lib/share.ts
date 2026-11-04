import { isCalendar, type AdventCalendar } from "./model.ts";
const MAX_LINK_BYTES = 14000;
export function encodeCalendar(calendar: AdventCalendar): string {
  const bytes = new TextEncoder().encode(JSON.stringify(calendar));
  if (bytes.length > MAX_LINK_BYTES)
    throw new Error(
      "Kalenderen er for stor for en prøvelenke. Last ned kalenderfilen i stedet. Bildedeling får egen lagring når kontoer kobles til.",
    );
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function decodeCalendar(encoded: string): AdventCalendar {
  if (!encoded || encoded.length > 20000 || !/^[A-Za-z0-9_-]+$/.test(encoded))
    throw new Error("Lenken er ugyldig eller for stor.");
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const value: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(decoded, (c) => c.charCodeAt(0)),
      ),
    );
    if (!isCalendar(value)) throw new Error();
    return value;
  } catch {
    throw new Error(
      "Vi kunne ikke åpne kalenderen. Be avsenderen om en ny lenke.",
    );
  }
}
