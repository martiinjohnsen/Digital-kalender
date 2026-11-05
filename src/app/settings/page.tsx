"use client";
import { useState, type ChangeEvent } from "react";
import { useStore } from "@/components/provider";
import { Icon } from "@/components/icons";
import { InstallButton } from "@/components/pwa";
import { Dialog } from "@/components/dialog";
import { downloadJson } from "@/lib/storage";
import { parseBackup, type AppData } from "@/lib/model";
import { AccountPanel } from "@/components/account-panel";
import { useAccount } from "@/components/account-provider";
import { authMessage } from "@/lib/cloud/client";
export default function SettingsPage() {
  const store = useStore();
  const { data, status, setPreferences, importData, toast, cloud, conflict } =
    store;
  const account = useAccount();
  const [migrationBusy, setMigrationBusy] = useState(false),
    [discard, setDiscard] = useState(false);
  const [name, setName] = useState(data.preferences.name);
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReading(true);
    setError("");
    try {
      if (file.size > 15000000)
        throw new Error("Sikkerhetskopien må være mindre enn 15 MB.");
      setIncoming(parseBackup(await file.text()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Filen kunne ikke leses.");
    } finally {
      setReading(false);
    }
  }
  return (
    <div className="page-enter settings-page">
      <div className="page-heading">
        <div>
          <h1>Konto og innstillinger</h1>
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-primary">
          <AccountPanel />
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="soft-icon">
                <Icon name="user" />
              </span>
              <div>
                <h2>Profil og visning</h2>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!setPreferences({ name: name.trim() })) return;
                toast("Hyggelig! Navnet ditt er lagret.");
              }}
            >
              <label>
                Ditt fornavn
                <input
                  maxLength={60}
                  placeholder="Hva skal vi kalle deg?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button className="button primary" type="submit">
                Lagre navn <Icon name="check" size={17} />
              </button>
            </form>
            <div className="setting-toggle">
              <div>
                <strong>Litt ekstra vinterstemning</strong>
                <p>Vis små stjerner i mottakervisningen.</p>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  aria-label="Vis vinterdekorasjoner"
                  checked={data.preferences.snow}
                  onChange={(event) =>
                    setPreferences({ snow: event.target.checked })
                  }
                />
                <span className="switch" />
              </label>
            </div>
          </section>
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="soft-icon sand">
                <Icon name="download" />
              </span>
              <div>
                <h2>Ta vare på de små gledene.</h2>
                <p>En sikkerhetskopi inneholder kalenderne og bildene dine.</p>
              </div>
            </div>
            <div className="local-storage-info">
              <span className={`status-dot ${status}`} />
              <div>
                <strong>
                  {status === "saved"
                    ? cloud
                      ? "Lagret på kontoen din"
                      : "Lagret på denne enheten"
                    : status === "saving"
                      ? "Lagrer endringer …"
                      : "Endringene er ikke trygt lagret"}
                </strong>
                <p>
                  {cloud
                    ? "Endringer lagres på kontoen din. En sikkerhetskopi gir deg også en egen fil med innholdet."
                    : "Kalenderne ligger foreløpig i denne nettleseren. Logg inn for å lagre dem på en konto og bruke dem på flere enheter."}
                </p>
              </div>
            </div>
            <div className="backup-actions">
              <button
                className="button secondary"
                onClick={() => {
                  downloadJson(
                    data,
                    `luke-sikkerhetskopi-${new Date().toISOString().slice(0, 10)}.json`,
                  );
                  toast("Sikkerhetskopien er lastet ned.");
                }}
              >
                <Icon name="download" size={17} />
                Last ned sikkerhetskopi
              </button>
              <label
                className={`button secondary ${reading ? "disabled" : ""}`}
              >
                <Icon name="upload" size={17} />
                {reading ? "Leser fil …" : "Importer kalenderfil"}
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={reading}
                  onChange={(event) => void readFile(event)}
                />
              </label>
            </div>
            <p className="field-help">
              Importer en Luke-fil (.json). Du får se innholdet før noe endres.
              Maks 15 MB.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </section>
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="soft-icon peach">
                <Icon name="phone" />
              </span>
              <div>
                <h2>Alltid litt advent i lomma.</h2>
                <p>Legg Luke på hjemskjermen og åpne den som en app.</p>
              </div>
            </div>
            <InstallButton />
          </section>
        </div>
        <aside className="settings-aside">
          <div className="account-card">
            <span className="account-mark">
              <Icon name="cloud" size={28} />
            </span>
            <span className="pill">
              {cloud ? "KOBLET TIL KONTO" : "LOKAL VISNING"}
            </span>
            <h2>
              {cloud
                ? "Kalenderne følger deg."
                : "Et hjem for kalenderne dine."}
            </h2>
            <p>
              {cloud
                ? "Fortsett på mobil eller PC. De du deler med, får oppdateringene dine og beholder sin egen fremdrift."
                : "Med en konto kan du fortsette på flere enheter og dele en kalender som oppdateres hos mottakeren."}
            </p>
            <div className="upcoming-list">
              <span>
                <Icon name="lock" size={16} />
                Egen konto og trygg innlogging
              </span>
              <span>
                <Icon name="cloud" size={16} />
                Kalenderne følger deg
              </span>
              <span>
                <Icon name="heart" size={16} />
                Del med mottakere
              </span>
            </div>
            <div className="account-note">
              {cloud ? (
                <>
                  <p>
                    Har du kalendere fra før innlogging? Flytt dem til kontoen
                    her. De lokale originalene beholdes.
                  </p>
                  <button
                    className="button primary full"
                    disabled={migrationBusy}
                    onClick={async () => {
                      setMigrationBusy(true);
                      try {
                        const count = await store.importLocal();
                        toast(
                          count
                            ? `${count} kalendere er lagt til kontoen.`
                            : "Ingen nye lokale kalendere å flytte.",
                        );
                      } catch (error) {
                        toast(authMessage(error));
                      } finally {
                        setMigrationBusy(false);
                      }
                    }}
                  >
                    {migrationBusy ? "Flytter …" : "Legg til lokale kalendere"}
                    <Icon name="upload" size={17} />
                  </button>
                </>
              ) : (
                "Du kan fortsatt lage lokale kalendere uten å logge inn."
              )}
            </div>
            {cloud && (
              <button
                className="button secondary full"
                onClick={() => void store.refresh()}
              >
                Hent siste oppdateringer
                <Icon name="cloud" size={17} />
              </button>
            )}
            {conflict && (
              <div className="account-conflict">
                <p>
                  Utkastet ditt og skyversjonen er forskjellige. Last ned en
                  sikkerhetskopi med knappen til venstre før du velger å hente
                  skyversjonen.
                </p>
                <button
                  className="button secondary full"
                  onClick={() => setDiscard(true)}
                >
                  Velg skyversjonen
                </button>
              </div>
            )}
          </div>
          <p className="privacy-note">
            <Icon name="lock" size={16} />
            {cloud
              ? "Innlogget som " +
                account.user?.email +
                ". Kalenderne lagres i Supabase med tilgang for deg og mottakerne dine."
              : "Lokale kalendere blir på enheten til du velger å flytte dem til kontoen."}
          </p>
        </aside>
      </div>
      {discard && (
        <Dialog title="Hente skyversjonen?" onClose={() => setDiscard(false)}>
          <div className="dialog-content">
            <p>
              Det lokale utkastet blir erstattet av versjonen på kontoen. Last
              ned en sikkerhetskopi først hvis du vil beholde utkastet.
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setDiscard(false)}
              >
                Behold utkastet
              </button>
              <button
                className="button primary"
                onClick={async () => {
                  try {
                    await store.useCloudVersion();
                    setDiscard(false);
                    toast("Skyversjonen er hentet.");
                  } catch (error) {
                    toast(authMessage(error));
                  }
                }}
              >
                Hent skyversjonen
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {incoming && (
        <Dialog title="Importere kalenderne?" onClose={() => setIncoming(null)}>
          <div className="dialog-content">
            <p className="dialog-intro">
              Filen inneholder {incoming.calendars.length}{" "}
              {incoming.calendars.length === 1 ? "kalender" : "kalendere"}.
              Navnet og visningsvalgene dine beholdes.
            </p>
            <ul className="import-list">
              {incoming.calendars.map((c) => (
                <li key={c.id}>
                  <Icon name="calendar" size={18} />
                  <span>
                    {c.title}
                    <small>{c.year} · 24 luker</small>
                  </span>
                  {data.calendars.some((existing) => existing.id === c.id) && (
                    <span className="pill">Erstatter eksisterende</span>
                  )}
                </li>
              ))}
            </ul>
            {incoming.calendars.some((c) =>
              data.calendars.some((existing) => existing.id === c.id),
            ) && (
              <div className="info-box">
                <strong>Noen kalendere finnes allerede.</strong>
                <p>
                  Kalendere med samme ID blir erstattet av innholdet i filen. Ta
                  gjerne en sikkerhetskopi først.
                </p>
              </div>
            )}
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setIncoming(null)}
              >
                Avbryt
              </button>
              <button
                className="button primary"
                onClick={() => {
                  if (!importData(incoming)) return;
                  setIncoming(null);
                  toast("Kalenderne er importert.");
                }}
              >
                Importer <Icon name="upload" size={17} />
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
