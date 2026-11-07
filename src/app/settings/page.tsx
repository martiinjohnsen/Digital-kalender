"use client";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/components/provider";
import { Icon } from "@/components/icons";
import { InstallButton } from "@/components/pwa";
import { Dialog } from "@/components/dialog";
import { downloadJson, repository } from "@/lib/storage";
import { AccountPanel } from "@/components/account-panel";
import { GlassSettings } from "@/components/glass-settings";
import { useAccount } from "@/components/account-provider";
import { authMessage } from "@/lib/cloud/client";
export default function SettingsPage() {
  const store = useStore();
  const account = useAccount();
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    if (!account.user) return;
    let active = true;
    void repository
      .load()
      .then((local) => {
        if (active)
          setLocalCount(
            local?.calendars.filter(
              (c) =>
                c.access !== "received" &&
                !store.data.calendars.some((saved) => saved.id === c.id),
            ).length ?? 0,
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [account.user?.id, store.data.calendars]);
  async function backupDraft() {
    try { await downloadJson(
      store.data,
      `luke-utkast-${new Date().toISOString().slice(0, 10)}.json`,
    ); } catch(error) { store.toast(authMessage(error)); }
  }
  return (
    <div className="page-enter settings-page">
      <div className="page-heading">
        <h1>{account.user ? "Konto" : "Logg inn"}</h1>
      </div>
      <div className="settings-layout account-layout">
        <div className="settings-primary">
          <Suspense
            fallback={
              <section className="settings-card">
                <p>Åpner kontosiden …</p>
              </section>
            }
          >
            <AccountPanel />
          </Suspense>
          {account.user && <GlassSettings />}
          {store.conflict && (
            <section className="settings-card account-conflict" role="alert">
              <h2>To versjoner av utkastet</h2>
              <p>
                Kalenderen er endret på en annen enhet. Ta vare på utkastet ditt
                før du henter versjonen fra kontoen.
              </p>
              <div className="account-action-row">
                <button className="button secondary" onClick={backupDraft}>
                  <Icon name="download" size={17} /> Last ned utkast
                </button>
                <button
                  className="button secondary"
                  onClick={() => setDiscard(true)}
                >
                  Hent versjonen fra kontoen
                </button>
              </div>
            </section>
          )}
          {store.cloud && localCount > 0 && (
            <details className="settings-card account-local-import">
              <summary>
                {localCount}{" "}
                {localCount === 1
                  ? "kalender fra den tidligere versjonen"
                  : "kalendere fra den tidligere versjonen"}
              </summary>
              <p>
                Disse ligger fortsatt i denne nettleseren. Legg dem til på
                kontoen for å bruke dem på flere enheter.
              </p>
              <button
                className="button secondary"
                disabled={migrationBusy}
                onClick={async () => {
                  setMigrationBusy(true);
                  try {
                    const count = await store.importLocal();
                    store.toast(
                      count
                        ? `${count} kalendere er lagt til kontoen.`
                        : "Ingen nye kalendere å legge til.",
                    );
                  } catch (error) {
                    store.toast(authMessage(error));
                  } finally {
                    setMigrationBusy(false);
                  }
                }}
              >
                <Icon name="upload" size={17} />{" "}
                {migrationBusy ? "Legger til …" : "Legg til på kontoen"}
              </button>
            </details>
          )}
        </div>
        <aside className="settings-aside account-aside">
          <section className="settings-card account-install-card">
            <h2>Luke på hjemskjermen</h2>
            <p>Åpne kalenderne dine som en app.</p>
            <InstallButton />
          </section>
        </aside>
      </div>
      {discard && (
        <Dialog
          title="Hente versjonen fra kontoen?"
          onClose={() => setDiscard(false)}
        >
          <div className="dialog-content">
            <p>
              Det lokale utkastet blir erstattet. Last det ned først hvis du vil
              beholde begge versjonene.
            </p>
            <div className="dialog-actions">
              <button className="button secondary" onClick={backupDraft}>
                Last ned utkast
              </button>
              <button
                className="button primary"
                onClick={async () => {
                  try {
                    await store.useCloudVersion();
                    setDiscard(false);
                    store.toast("Versjonen fra kontoen er hentet.");
                  } catch (error) {
                    store.toast(authMessage(error));
                  }
                }}
              >
                Hent fra kontoen
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
