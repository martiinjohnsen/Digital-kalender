"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseBackup, type AdventCalendar, type AppData } from "@/lib/model";
import { initialData } from "@/lib/templates";
import { repository } from "@/lib/storage";
import { Icon } from "./icons";
type Store = {
  data: AppData;
  status: "saving" | "saved" | "error";
  saveError: string;
  add: (calendar: AdventCalendar) => boolean;
  update: (id: string, change: Partial<AdventCalendar>) => boolean;
  remove: (id: string) => boolean;
  setPreferences: (change: Partial<AppData["preferences"]>) => boolean;
  importData: (data: AppData) => boolean;
  toast: (message: string) => void;
};
const Context = createContext<Store | null>(null);
export function useStore(): Store {
  const store = useContext(Context);
  if (!store) throw new Error("Luke mangler dataleverandør.");
  return store;
}
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [fatal, setFatal] = useState("");
  const [status, setStatus] = useState<Store["status"]>("saving");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  const currentData = useRef<AppData | null>(null);
  const toast = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    let cancelled = false;
    repository
      .load()
      .then((value) => {
        if (!cancelled) {
          const loaded = value ?? initialData();
          currentData.current = loaded;
          setData(loaded);
        }
      })
      .catch((error) => {
        if (!cancelled)
          setFatal(
            error instanceof Error
              ? error.message
              : "Nettleseren kunne ikke åpne den lokale lagringen.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!data) return;
    const current = ++revision.current;
    setStatus("saving");
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (JSON.stringify(data).length > 15000000)
          throw new Error(
            "Kalenderne bruker mer enn 15 MB. Ta en sikkerhetskopi og fjern noen store bilder før du fortsetter.",
          );
        await repository.save(data);
      })
      .then(() => {
        if (current === revision.current) {
          setStatus("saved");
          setSaveError("");
        }
      })
      .catch((error) => {
        if (current === revision.current) {
          setStatus("error");
          setSaveError(
            error instanceof Error
              ? error.message
              : "Endringene kunne ikke lagres. Last ned en sikkerhetskopi før du lukker siden.",
          );
        }
      });
  }, [data]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (status !== "saved") {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);
  if (fatal)
    return (
      <main className="recovery">
        <Icon name="cloud" size={40} />
        <h1>Vi får ikke åpnet lagringen</h1>
        <p>
          Innholdet ditt er ikke erstattet. Prøv å åpne siden igjen, eller bruk
          en vanlig nettleserfane.
        </p>
        <p className="form-error">{fatal}</p>
        <button className="button primary" onClick={() => location.reload()}>
          Prøv igjen
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="loading-screen">
        <span className="loading-star">
          <Icon name="sparkles" size={28} />
        </span>
        <p>Vi finner frem litt adventsglede …</p>
      </main>
    );
  function commit(change: (previous: AppData) => AppData): boolean {
    const previous = currentData.current ?? data;
    if (!previous) return false;
    const next = change(previous);
    try {
      if (next.calendars.length > 100)
        throw new Error("Du kan ha opptil 100 kalendere på denne enheten.");
      const serialized = JSON.stringify(next);
      if (new TextEncoder().encode(serialized).length > 15000000)
        throw new Error(
          "Endringen blir for stor for den lokale grensen på 15 MB. Fjern et bilde eller en kalender først. Innholdet ditt er beholdt.",
        );
      parseBackup(serialized);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Endringen kunne ikke brukes. Innholdet ditt er beholdt.",
      );
      return false;
    }
    currentData.current = next;
    setData(next);
    return true;
  }
  const value: Store = {
    data,
    status,
    saveError,
    toast,
    add: (calendar) =>
      commit((previous) => ({
        ...previous,
        calendars: [calendar, ...previous.calendars],
      })),
    update: (id, change) =>
      commit((previous) => ({
        ...previous,
        calendars: previous.calendars.map((calendar) =>
          calendar.id === id
            ? {
                ...calendar,
                ...change,
                id: calendar.id,
                updatedAt: new Date().toISOString(),
              }
            : calendar,
        ),
      })),
    remove: (id) =>
      commit((previous) => ({
        ...previous,
        calendars: previous.calendars.filter((calendar) => calendar.id !== id),
      })),
    setPreferences: (change) =>
      commit((previous) => ({
        ...previous,
        preferences: { ...previous.preferences, ...change },
      })),
    importData: (incoming) =>
      commit((previous) => ({
        ...previous,
        calendars: [
          ...incoming.calendars,
          ...previous.calendars.filter(
            (calendar) =>
              !incoming.calendars.some((item) => item.id === calendar.id),
          ),
        ],
      })),
  };
  return (
    <Context.Provider value={value}>
      {status === "error" && (
        <div role="alert" className="storage-warning">
          {saveError ||
            "Lagringen feilet. Ta en sikkerhetskopi i Innstillinger før du lukker siden."}
        </div>
      )}
      {children}
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {notice}
          <button aria-label="Lukk melding" onClick={() => setNotice("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
