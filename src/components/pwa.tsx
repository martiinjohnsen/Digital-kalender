"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "./dialog";
import { Icon } from "./icons";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
const InstallContext = createContext<{
  install: () => void;
  installed: boolean;
}>({ install: () => {}, installed: false });
export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const network = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", done);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    network();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", done);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  async function install() {
    if (prompt) {
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } finally {
        setPrompt(null);
      }
    } else setGuide(true);
  }
  return (
    <InstallContext.Provider value={{ install, installed }}>
      {offline && (
        <div className="offline-banner" role="status">
          Du er frakoblet. Det du gjør, lagres fortsatt på denne enheten.
        </div>
      )}
      {children}
      {guide && (
        <Dialog title="Ta Luke med deg" onClose={() => setGuide(false)}>
          <div className="install-guide">
            <span className="large-icon">
              <Icon name="phone" size={30} />
            </span>
            <h3>En liten app på hjemskjermen</h3>
            <p>
              Åpne Luke på mobilen og legg den til på hjemskjermen. Da får du et
              eget ikon og mer plass til kalenderne.
            </p>
            <div className="info-box">
              <strong>iPhone eller iPad</strong>
              <p>
                Åpne i Safari. Trykk Del, velg «Legg til på Hjem-skjerm» og
                deretter «Legg til».
              </p>
            </div>
            <div className="info-box">
              <strong>Android og Chrome</strong>
              <p>
                Åpne nettlesermenyen og velg «Installer app» eller «Legg til på
                startskjermen».
              </p>
            </div>
            <p className="muted small">
              Installasjon krever at siden er publisert med HTTPS, eller at den
              kjøres på localhost. Nettleseren bestemmer når installasjonsvalget
              vises.
            </p>
            <button
              className="button primary full"
              onClick={() => setGuide(false)}
            >
              Det høres fint ut <Icon name="check" size={18} />
            </button>
          </div>
        </Dialog>
      )}
    </InstallContext.Provider>
  );
}
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const { install, installed } = useContext(InstallContext);
  return (
    <button
      className={compact ? "install-card" : "button secondary"}
      onClick={install}
    >
      {compact ? (
        <>
          <span className="install-icon">
            <Icon name="phone" size={23} />
          </span>
          <span>
            <strong>
              {installed ? "Luke er installert" : "Ta Luke med deg"}
            </strong>
            <small>
              {installed
                ? "På din egen hjemskjerm"
                : "Legg til på hjemskjermen"}
            </small>
          </span>
          <Icon name="chevron" size={16} />
        </>
      ) : (
        <>
          <Icon name="phone" size={18} />
          {installed ? "Appen er installert" : "Installer Luke"}
        </>
      )}
    </button>
  );
}
