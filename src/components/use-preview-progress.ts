"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authMessage, rpcForUser, supabase } from "@/lib/cloud/client";
import { emptyPreviewProgress, legacyPreviewProgress, type PreviewProgress } from "@/lib/preview-progress";
import type { LocalProgress } from "@/lib/local-progress";

type Mode = "test" | "date";

export function usePreviewProgress(userId: string | null, calendarId: string, year: number) {
  const identity = `${userId ?? "guest"}:${calendarId}:${year}`;
  const current = useRef(identity);
  current.current = identity;
  const [snapshot, setSnapshot] = useState({ identity: "", data: emptyPreviewProgress, ready: false, error: "" });
  const [pending, setPending] = useState("");
  const accept = useCallback((data: PreviewProgress) => {
    if (current.current !== identity) return;
    setSnapshot(previous => previous.identity === identity && previous.data.revision > data.revision
      ? previous : { identity, data, ready: true, error: "" });
  }, [identity]);
  const report = useCallback((error: unknown) => {
    if (current.current !== identity) return;
    const missing = !!error && typeof error === "object" && "code" in error && error.code === "PGRST202";
    const message = missing ? "Kontolagring for prøvefremdrift er ikke aktivert ennå." : authMessage(error);
    setSnapshot(previous => previous.identity === identity
      ? { ...previous, error: message }
      : { identity, data: emptyPreviewProgress, ready: false, error: message });
  }, [identity]);
  const request = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await rpcForUser(userId, "luke_preview", { p_calendar_id: calendarId, p_action: action, p_payload: payload });
    if (error) throw error;
    if (current.current !== identity) throw new Error("Forhåndsvisningen er byttet.");
    return data as PreviewProgress;
  }, [userId, calendarId, identity]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let loading = false;
    let migrated = false;
    const reload = async () => {
      if (loading || cancelled) return;
      loading = true;
      try {
        let data = await request("load");
        if (cancelled) return;
        if (!migrated) {
          // Import each device once; merge atomically on the server so a later
          // visit on another device cannot overwrite a stored first attempt.
          let legacy: ReturnType<typeof legacyPreviewProgress> | undefined;
          try { legacy = legacyPreviewProgress(localStorage, userId, calendarId, year); } catch { /* Storage may be blocked. */ }
          if (legacy && !legacy.alreadyImported) {
            if (!data.initialized && legacy.wasEnabled) data = await request("enable", { enabled: true });
            if (cancelled) return;
            if (legacy.test.opened.length || legacy.date.opened.length || Object.keys(legacy.test.answers).length || Object.keys(legacy.date.answers).length)
              data = await request("import", { test: legacy.test, date: legacy.date });
            if (cancelled) return;
            try { localStorage.setItem(legacy.marker, "true"); } catch { /* Re-importing is safe. */ }
          }
          migrated = true;
        }
        accept(data);
      } catch (error) { if (!cancelled) report(error); }
      finally { loading = false; }
    };
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    const channel = supabase().channel(`preview:${identity}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "luke_preview_progress", filter: `calendar_id=eq.${calendarId}` }, refresh)
      .subscribe();
    void reload();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    // Reconcile after reconnects even when realtime is temporarily unavailable.
    const timer = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      void supabase().removeChannel(channel);
    };
  }, [userId, calendarId, year, identity, request, accept, report]);

  const merge = async (mode: Mode, progress: LocalProgress) => {
    try { accept(await request("merge", { mode, progress })); }
    catch (error) { report(error); throw error; }
  };
  const setSaving = async (enabled: boolean) => {
    setPending(identity);
    try { accept(await request("enable", { enabled })); }
    catch (error) { report(error); }
    finally { setPending(previous => previous === identity ? "" : previous); }
  };
  const active = snapshot.identity === identity;
  return {
    data: active ? snapshot.data : emptyPreviewProgress,
    ready: active && snapshot.ready,
    error: active ? snapshot.error : "",
    pending: pending === identity,
    setSaving, merge,
  };
}
