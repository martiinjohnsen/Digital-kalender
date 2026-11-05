import Link from "next/link";

export default function PrivacyPage() {
  return (
    <article className="settings-page page-enter">
      <div className="page-heading"><h1>Personvern i Luke</h1></div>
      <section className="settings-card">
        <h2>Opplysninger vi bruker</h2>
        <p>Når du logger inn med Google, mottar Luke navn, e-postadresse, bruker-ID og eventuelt profilbilde. Luke får ikke passordet ditt eller tilgang til Gmail og Google-kalenderen din.</p>
        <h2>Kalendere og deling</h2>
        <p>Vi lagrer kalenderne du lager, profilnavnet ditt og fremdriften og quizsvarene dine. Dette brukes til å vise kalenderne på kontoen din og gi mottakere tilgang til kalendere du deler. De som får delingslenken din, kan bruke den til å få mottakertilgang med sin egen konto.</p>
        <h2>Lagring og leverandører</h2>
        <p>Supabase håndterer innlogging og lagring. Vercel drifter nettsiden. Nettleseren lagrer innloggingsøkten og en lokal kopi av kalenderdata, blant annet for å bevare utkast ved nettverksfeil. Videoer fra YouTube lastes først når du velger å spille dem av.</p>
        <h2>Kontroll over innholdet ditt</h2>
        <p>Du kan endre navn, redigere og slette egne kalendere og avslutte deling i appen. For spørsmål om opplysningene dine, innsyn eller sletting av kontoen kan du kontakte <a href="mailto:martin.johnsen@outlook.com">martin.johnsen@outlook.com</a>.</p>
        <p>Sist oppdatert: 5. november 2026.</p>
        <Link href="/settings" className="button secondary">Tilbake til konto</Link>
      </section>
    </article>
  );
}
