"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "./account-provider";
import { useStore } from "./provider";
import { authMessage, supabase } from "@/lib/cloud/client";
import { Icon } from "./icons";
export function AccountPanel() {
  const account = useAccount(),
    store = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const createAfterLogin = search.get("next") === "create";
  useEffect(() => {
    if (!account.user || !store.cloud) return;
    let hasInvite = false;
    try {
      const token = localStorage.getItem("luke:pending-invite");
      if (token && /^[a-f0-9]{64}$/.test(token)) {
        hasInvite = true;
        router.replace(`/receive#invite=${token}`);
      }
    } catch {}
    let pendingCreate = createAfterLogin;
    try {
      pendingCreate ||= sessionStorage.getItem("luke:after-login") === "create";
      if (pendingCreate || hasInvite) sessionStorage.removeItem("luke:after-login");
    } catch {}
    if (!hasInvite && pendingCreate) {
      router.replace("/calendars?create=1");
    }
  }, [account.user?.id, store.cloud, createAfterLogin, router]);
  const [name, setName] = useState(store.data.preferences.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setName(store.data.preferences.name);
  }, [store.data.preferences.name]);
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const failure = params.get("error_description") || search.get("error_description");
    if (failure) {
      setError("Google-innloggingen ble avbrutt eller feilet. Prøv igjen.");
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, [search]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (error) {
      setError(authMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function googleLogin() {
    await action(async () => {
      // OAuth returns to the exact allowlisted URL; preserve only our own action.
      try {
        if (createAfterLogin) sessionStorage.setItem("luke:after-login", "create");
        else sessionStorage.removeItem("luke:after-login");
      } catch {}
      const { data, error } = await supabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/settings`,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Kunne ikke åpne Google. Prøv igjen.");
      location.assign(data.url);
    });
  }
  return (
    <section
      className="settings-card account-panel"
      aria-labelledby="account-title"
    >
      <div className="settings-card-heading">
        <span className="soft-icon">
          <Icon name="user" size={25} />
        </span>
        <div>
          <h2 id="account-title">
            {account.user ? "Kontoen din" : "Velkommen til Luke"}
          </h2>
          <p>
            {account.user
              ? account.user.email
              : createAfterLogin
                ? "Logg inn eller opprett en konto for å lage kalenderen din."
                : "Logg inn med Google for å komme i gang."}
          </p>
        </div>
      </div>
      {!account.user ? (
        <>
          {!account.configured && (
            <p className="form-error" role="alert">
              Innlogging er ikke tilgjengelig akkurat nå. Prøv igjen senere.
            </p>
          )}
          <button
            className="button secondary google-login"
            disabled={busy || !account.configured || !account.ready}
            onClick={() => void googleLogin()}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z" />
              <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z" />
            </svg>
            {busy ? "Åpner Google …" : "Fortsett med Google"}
          </button>
          <p className="google-login-note">
            Ny her? Kontoen din opprettes første gang du logger inn.
          </p>
          <p className="field-help"><Link href="/privacy">Personvern</Link></p>
          <p className="field-help">
            Du kan utforske Luke uten konto. For å lage og dele kalendere må du
            være innlogget.
          </p>
        </>
      ) : (
        <>
          <div className="account-signed-in">
            <span className="pill">
              <Icon name="check" size={14} />
              Innlogget
            </span>
            <span className="muted">
              Kalenderne er knyttet til denne kontoen.
            </span>
          </div>
          <form
            className="account-form account-profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              if (store.setPreferences({ name: name.trim() }))
                store.toast("Navnet ditt er oppdatert.");
            }}
          >
            <label>
              Navn
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                autoComplete="name"
                required
              />
            </label>
            <button
              className="button secondary"
              type="submit"
              disabled={
                !name.trim() || name.trim() === store.data.preferences.name
              }
            >
              Lagre navn <Icon name="check" size={17} />
            </button>
          </form>
          <div className="account-action-row">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await store.syncNow().catch(() => {});
                  const { error } = await supabase().auth.signOut({
                    scope: "local",
                  });
                  if (error) throw error;
                })
              }
            >
              <Icon name="external" size={17} />
              Logg ut
            </button>
          </div>
          <div className="setting-toggle">
            <div>
              <strong>Vinterstemning</strong>
              <p>Vis små stjerner rundt kalenderen du åpner.</p>
            </div>
            <label className="switch-label">
              <input
                type="checkbox"
                aria-label="Vis vinterdekorasjoner"
                checked={store.data.preferences.snow}
                onChange={(event) =>
                  store.setPreferences({ snow: event.target.checked })
                }
              />
              <span className="switch" />
            </label>
          </div>
        </>
      )}
      {(error || account.error) && (
        <p className="form-error" role="alert">
          {error || account.error}
        </p>
      )}
    </section>
  );
}
