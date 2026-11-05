"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "./account-provider";
import { useStore } from "./provider";
import { authMessage, emailReady, supabase } from "@/lib/cloud/client";
import { Icon } from "./icons";
export function AccountPanel() {
  const account = useAccount(),
    store = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!account.user || account.recovery) return;
    try {
      const token = localStorage.getItem("luke:pending-invite");
      if (token && /^[a-f0-9]{64}$/.test(token))
        router.replace(`/receive#invite=${token}`);
    } catch {}
  }, [account.user?.id, account.recovery, router]);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState(""),
    [name, setName] = useState("");
  const [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState(""),
    [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [changePassword, setChangePassword] = useState(false);
  useEffect(() => {
    if (account.recovery) setChangePassword(true);
  }, [account.recovery]);
  const resetFields = () => {
    setError("");
    setMessage("");
    setPassword("");
    setRepeat("");
    setCurrentPassword("");
  };
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setError(authMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await action(async () => {
      const address = email.trim();
      if (mode === "signup") {
        if (password.length < 10)
          throw new Error("Passordet må ha minst 10 tegn.");
        if (password !== repeat) throw new Error("Passordene er ikke like.");
        const { data, error } = await supabase().auth.signUp({
          email: address,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${location.origin}/settings`,
          },
        });
        if (error) throw error;
        setPassword("");
        setRepeat("");
        if (!data.session)
          setMessage(
            "Se etter en bekreftelse i e-posten din. Bekreft adressen før du logger inn. Har du allerede en konto, kan du logge inn eller velge Glemt passord.",
          );
      } else if (mode === "login") {
        const { error } = await supabase().auth.signInWithPassword({
          email: address,
          password,
        });
        if (error) throw error;
        setPassword("");
      } else {
        const { error } = await supabase().auth.resetPasswordForEmail(address, {
          redirectTo: `${location.origin}/settings`,
        });
        if (error) throw error;
        setMessage(
          "Hvis det finnes en konto med denne adressen, sender vi en lenke for å velge nytt passord.",
        );
      }
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
              : "Logg inn og ta kalenderne dine med deg."}
          </p>
        </div>
      </div>
      {!account.user ? (
        <>
          <div
            className="account-tabs"
            role="group"
            aria-label="Velg kontohandling"
          >
            <button
              type="button"
              className={`button secondary ${mode === "login" ? "selected" : ""}`}
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                resetFields();
              }}
            >
              Logg inn
            </button>
            <button
              type="button"
              className={`button secondary ${mode === "signup" ? "selected" : ""}`}
              aria-pressed={mode === "signup"}
              onClick={() => {
                setMode("signup");
                resetFields();
              }}
            >
              Opprett konto
            </button>
          </div>
          {!account.configured && (
            <p className="form-error" role="alert">
              Kontotjenesten er ikke koblet til denne versjonen ennå. Du kan
              fortsatt bruke Luke lokalt.
            </p>
          )}
          <form onSubmit={submit} className="account-form">
            {mode === "reset" && (
              <div>
                <h3>Glemt passord?</h3>
                <p>Vi sender deg en lenke for å velge et nytt.</p>
              </div>
            )}
            {mode === "signup" && (
              <label>
                Navn
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Hva heter du?"
                  required
                />
              </label>
            )}
            <label>
              E-post
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deg@eksempel.no"
                maxLength={254}
                required
              />
            </label>
            {mode !== "reset" && (
              <label>
                Passord
                <input
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={mode === "signup" ? 10 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "Minst 10 tegn" : "Ditt passord"
                  }
                  required
                />
              </label>
            )}
            {mode === "signup" && (
              <label>
                Gjenta passord
                <input
                  type="password"
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  maxLength={128}
                  required
                />
              </label>
            )}
            <button
              className="button primary full"
              disabled={busy || !account.configured}
              type="submit"
            >
              {busy
                ? "Et øyeblikk …"
                : mode === "login"
                  ? "Logg inn"
                  : mode === "signup"
                    ? "Opprett konto"
                    : "Send passordlenke"}
              <Icon name="arrow" size={17} />
            </button>
            <button
              className="button secondary full"
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(mode === "reset" ? "login" : "reset");
                resetFields();
              }}
            >
              {mode === "reset" ? "Tilbake til innlogging" : "Glemt passord?"}
            </button>
            {mode === "login" && email && (
              <button
                className="button secondary full"
                type="button"
                disabled={busy || !account.configured}
                onClick={() =>
                  void action(async () => {
                    const { error } = await supabase().auth.resend({
                      type: "signup",
                      email: email.trim(),
                      options: {
                        emailRedirectTo: `${location.origin}/settings`,
                      },
                    });
                    if (error) throw error;
                    setMessage(
                      "Hvis kontoen venter på bekreftelse, sender vi en ny e-post.",
                    );
                  })
                }
              >
                Send bekreftelsen på nytt
              </button>
            )}
          </form>
          {!emailReady && (
            <div className="account-email-note">
              <Icon name="message" size={18} />
              <p>
                E-postutsending er under oppsett. Registrering og passordeposter
                til nye brukere blir tilgjengelig når den er koblet til.
              </p>
            </div>
          )}
          <p className="field-help">
            Vil du prøve først?{" "}
            <Link href="/calendars">Fortsett med lokale kalendere</Link>.
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
          <div className="account-action-row">
            <button
              className="button secondary"
              onClick={() => {
                setChangePassword((v) => !v);
                resetFields();
              }}
              disabled={busy}
            >
              <Icon name="lock" size={17} />
              {changePassword ? "Lukk passordfelt" : "Endre passord"}
            </button>
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
          {changePassword && (
            <form
              className="account-form password-form"
              onSubmit={(event) => {
                event.preventDefault();
                void action(async () => {
                  if (password.length < 10)
                    throw new Error("Passordet må ha minst 10 tegn.");
                  if (password !== repeat)
                    throw new Error("Passordene er ikke like.");
                  if (!account.recovery) {
                    const { error } = await supabase().auth.signInWithPassword({
                      email: account.user!.email!,
                      password: currentPassword,
                    });
                    if (error) throw error;
                  }
                  const { error } = await supabase().auth.updateUser({
                    password,
                  });
                  if (error) throw error;
                  setPassword("");
                  setRepeat("");
                  setCurrentPassword("");
                  setChangePassword(false);
                  account.finishRecovery();
                  setMessage("Passordet er endret.");
                });
              }}
            >
              <h3>
                {account.recovery ? "Velg nytt passord" : "Endre passord"}
              </h3>
              {!account.recovery && (
                <label>
                  Nåværende passord
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </label>
              )}
              <label>
                Nytt passord
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={10}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                Gjenta nytt passord
                <input
                  type="password"
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  maxLength={128}
                  required
                />
              </label>
              <button className="button primary" disabled={busy} type="submit">
                {busy ? "Lagrer …" : "Lagre nytt passord"}
                <Icon name="check" size={17} />
              </button>
            </form>
          )}
        </>
      )}
      {(error || account.error) && (
        <p className="form-error" role="alert">
          {error || account.error}
        </p>
      )}
      {message && (
        <div className="account-success" role="status">
          <Icon name="check" size={18} />
          <p>{message}</p>
        </div>
      )}
    </section>
  );
}
