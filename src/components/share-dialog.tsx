"use client";
import Link from "next/link";
import { useState } from "react";
import { type AdventCalendar, completedCount } from "@/lib/model";
import { downloadJson } from "@/lib/storage";
import { authMessage, rpcForUser } from "@/lib/cloud/client";
import { useAccount } from "./account-provider";
import { useStore } from "./provider";
import { Dialog } from "./dialog";
import { Icon } from "./icons";
export function ShareDialog({
  calendar,
  onClose,
}: {
  calendar: AdventCalendar;
  onClose: () => void;
}) {
  const store = useStore();
  const account = useAccount();
  const [link, setLink] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmStop, setConfirmStop] = useState(false);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      await store.syncNow();
      const { data, error } = await rpcForUser(
        account.user?.id ?? null,
        "create_luke_invite",
        {
          p_calendar_id: calendar.id,
        },
      );
      if (error) throw error;
      setLink(`${location.origin}/receive#invite=${data}`);
    } catch (error) {
      setError(authMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Del kalender" onClose={onClose}>
      <div className="share-content">
        <span className="large-icon">
          <Icon name="gift" size={30} />
        </span>
        <h3>{calendar.title}</h3>
        <p className="muted">{completedCount(calendar)} av 24 luker er fylt.</p>
        {store.cloud ? (
          <>
            <div className="info-box">
              <strong>Én kalender, alltid oppdatert</strong>
              <p>
                Mottakeren logger inn og får kalenderen under Delt med meg.
                Endringene dine følger med automatisk. Bare du kan redigere, og
                lukene åpner på riktig dato etter norsk tid.
              </p>
            </div>
            {!link ? (
              <button
                className="button primary full"
                disabled={busy}
                onClick={() => void generate()}
              >
                <Icon name="share" size={17} />
                {busy ? "Lager lenke …" : "Lag delingslenke"}
              </button>
            ) : (
              <>
                <label>
                  Delingslenken
                  <input
                    className="share-url"
                    readOnly
                    value={link}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <button
                  className="button primary full"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link);
                      store.toast("Delingslenken er kopiert.");
                    } catch {
                      setError("Marker og kopier lenken i feltet over.");
                    }
                  }}
                >
                  <Icon name="copy" size={17} />
                  Kopier lenke
                </button>
                <p className="field-help">
                  Alle som får lenken kan legge kalenderen til sin konto. Send
                  den bare til dem du vil dele med.
                </p>
              </>
            )}
            {!confirmStop ? (
              <button
                className="button secondary full"
                disabled={busy}
                onClick={() => setConfirmStop(true)}
              >
                Stopp deling
              </button>
            ) : (
              <div className="info-box">
                <p>
                  Dette avslutter lenken og fjerner mottakernes tilgang. Du
                  beholder kalenderen og kan lage en ny lenke senere.
                </p>
                <div className="account-action-row">
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => setConfirmStop(false)}
                  >
                    Avbryt
                  </button>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const { error } = await rpcForUser(
                          account.user?.id ?? null,
                          "stop_luke_sharing",
                          { p_calendar_id: calendar.id },
                        );
                        if (error) throw error;
                        setLink("");
                        setConfirmStop(false);
                        store.toast("Delingen er avsluttet.");
                      } catch (error) {
                        setError(authMessage(error));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Stopp delingen
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="info-box">
            <strong>Logg inn for å dele</strong>
            <p>
              Legg kalenderen på en konto først. Da følger nye endringer med hos
              mottakeren, og fremtidige luker holdes låst.
            </p>
            <Link
              className="button primary full"
              href="/settings"
              onClick={onClose}
            >
              Til konto
              <Icon name="user" size={17} />
            </Link>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button secondary full"
          onClick={() => {
            downloadJson(
              {
                version: 1,
                calendars: [calendar],
                preferences: store.data.preferences,
              },
              `luke-kalender-${calendar.year}.json`,
            );
            store.toast("Kalenderfilen er lastet ned.");
          }}
        >
          <Icon name="download" size={17} />
          Last ned kalenderfil
        </button>
        <p className="field-help">
          Kalenderfilen er din sikkerhetskopi. Den inneholder også luker som
          ennå ikke har åpnet.
        </p>
      </div>
    </Dialog>
  );
}
