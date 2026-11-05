"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicCloudConfig } from "./public-config";
let client: SupabaseClient | null = null;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || publicCloudConfig.url;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  publicCloudConfig.publishableKey;
export const cloudConfigured = Boolean(url && publishableKey);
export const emailReady = process.env.NEXT_PUBLIC_AUTH_EMAIL_READY === "true";
export function supabase(): SupabaseClient {
  if (!cloudConfigured)
    throw new Error("Kontotjenesten er ikke koblet til ennå.");
  return (client ??= createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  }));
}
export async function rpcForUser(
  userId: string | null,
  name: string,
  args?: Record<string, unknown>,
) {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw error;
  if (!userId || !data.session || data.session.user.id !== userId)
    throw new Error("Innloggingen har endret seg. Åpne siden på nytt.");
  // Bind the request to this user's token, even if another tab changes the
  // active account while a queued save is waiting for its network request.
  const token = data.session.access_token;
  const scoped = createClient(url, publishableKey, {
    accessToken: async () => token,
  });
  return scoped.rpc(name, args);
}
export function authMessage(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : String(error);
  if (/invalid login credentials/i.test(raw))
    return "E-post eller passord er feil.";
  if (/new password.*different/i.test(raw))
    return "Velg et annet passord enn det du allerede bruker.";
  if (/signup.*disabled|signups.*disabled/i.test(raw))
    return "Registrering av nye kontoer er ikke åpnet ennå.";
  if (/email.*invalid/i.test(raw)) return "Skriv en gyldig e-postadresse.";
  if (/email not confirmed/i.test(raw))
    return "Bekreft e-postadressen før du logger inn. Du kan sende en ny bekreftelse nedenfor.";
  if (/otp.*expired|token.*expired|invalid.*token|link.*expired/i.test(raw))
    return "Lenken er utløpt eller allerede brukt. Be om en ny bekreftelse eller passordlenke.";
  if (/email.*not authorized|smtp|error sending/i.test(raw))
    return "E-postutsendingen er ikke ferdig tilkoblet. Bekreftelse og passordeposter til nye brukere er derfor ikke tilgjengelig ennå.";
  if (/rate limit|too many|security purposes/i.test(raw))
    return "Litt mange forsøk på kort tid. Vent noen minutter og prøv igjen.";
  if (/password.*(weak|least|short)/i.test(raw))
    return "Velg et sterkere passord med minst 10 tegn.";
  if (/fetch|network|offline|timeout/i.test(raw))
    return "Vi får ikke kontakt akkurat nå. Sjekk nettforbindelsen og prøv igjen.";
  if (/40001|annen enhet|Utkastet/i.test(raw))
    return "Kalenderen er endret på en annen enhet. Utkastet ditt er beholdt. Ta en sikkerhetskopi før du henter skyversjonen.";
  return raw || "Noe gikk galt. Prøv igjen.";
}
