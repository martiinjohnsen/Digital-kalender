# Luke

Mobiltilpasset adventskalender med Next.js, React og TypeScript. Kildekode: https://github.com/martiinjohnsen/Luke. Nettside: https://luke-kalender.vercel.app.

## Start lokalt

```bash
npm ci
npm run dev
```

Åpne http://localhost:3001. Bruk Node.js 24 eller nyere. Hvis npm ikke får skrive til standardbufferen, bruk `npm ci --cache .cache/npm`.

## Konto og lagring

- Konto-siden har registrering, innlogging, ny bekreftelsesepost, glemt passord, passordbytte og utlogging. Supabase Auth håndterer passord og innloggingsøkter.
- Uten innlogging lagres kalendere lokalt i IndexedDB. Etter innlogging lastes kontoens egne kalendere og mottatte kalendere fra Supabase.
- Lokale kalendere flyttes bare ved et uttrykkelig valg under Konto. De lokale originalene beholdes.
- Innloggede brukere får en lokal, kontoavgrenset kopi av siste data og eventuelle ulagrede utkast. Nettverksfeil blir synlige. Utkast blir ikke erstattet av et mislykket nettverkskall.
- Kalenderendringer bruker revisjonskontroll. Ved en konflikt beholdes utkastet. Brukeren kan ta en sikkerhetskopi før skyversjonen hentes.
- Eiers forhåndsvisning og prøvesvar er adskilt fra mottakerens lagrede fremdrift.

**E-postutsending må kobles til før ordinær registrering åpnes for alle.** Supabase sin innebygde avsender er begrenset til prosjektets autoriserte teamadresser. Bekreftelse av e-post beholdes. Vi slår ikke av bekreftelsen for å omgå manglende utsending.

## Deling

Innlogget eier kan opprette en tilfeldig delingslenke. Mottakeren logger inn og får lesetilgang, med sin egen fremdrift og quizsvar. Delingslenken inneholder en invitasjon i URL-fragmentet, ikke kalenderinnholdet.

Kalenderdokumentet er bare direkte lesbart for eieren. Mottakerdata hentes gjennom databasefunksjoner som holder tilbake fremtidige luker etter norsk tid. Quizfasit og avsenderkommentar følger først med etter at mottakeren har sendt et svar. Første svar på samme spørsmålsversjon beholdes. Endres spørsmålet, får det en ny nøkkel.

Realtime-varsler inneholder kalender-ID og revisjon, ikke hele kalenderdokumentet. Appen henter nye, tilgangskontrollerte data ved varsler, når den får fokus/nett igjen, og ved norsk midnatt. Eieren kan avslutte delingen. JSON-eksport er en privat sikkerhetskopi som også inneholder fremtidige luker. Gamle prøvelenker kan fortsatt åpnes som eldre, statiske kopier; de gir ikke en ny konto tilgang til originalen.

## Oppsett av et nytt Supabase-prosjekt

1. Kjør `supabase/migrations/202611050001_accounts.sql` én gang i et nytt prosjekt. Migrasjonen oppretter tabeller, RLS-regler, revisjonskontroll, mottakerfunksjoner og Realtime-publication.
2. Bruk prosjektets URL og **publishable key**. `src/lib/cloud/public-config.ts` inneholder de offentlige identifikatorene for Luke. `.env.example` viser valgfrie overstyringer for en annen installasjon. Ingen administrative nøkler eller service-role-nøkler skal inn i appen.
3. Sett Site URL til `https://luke-kalender.vercel.app`. Tillat nøyaktig `https://luke-kalender.vercel.app/settings` og `http://localhost:3001/settings` som returadresser. Unngå vide wildcard-regler.
4. Behold e-postbekreftelse. Koble en egen SMTP-avsender til Supabase, og test bekreftelse og passordlenke med en adresse som ikke er en del av prosjektteamet. Sett først da `NEXT_PUBLIC_AUTH_EMAIL_READY=true` og bygg på nytt.

Prosjektets publishable key er beregnet for klientbruk og gir ingen administrative rettigheter. Tilgang til data håndheves i databasen med brukerens verifiserte Supabase-token. Hemmelige SMTP- og administrasjonsnøkler hører bare hjemme i leverandørens innstillinger eller servermiljøet.

## Kalenderfunksjoner

Mine kalendere har søk, sortering og filtrene Alle, Laget av meg og Delt med meg. Kalenderen har 24 luker med tekst, bilder, YouTube, lenker, opplevelser, manuelt innlagte gavekort og quiz. Innholdsbokser kan dras i rekkefølge. Quiz støtter inntil 12 alternativer, flere riktige svar og fritekst med godkjente svarvarianter.

Ni fargepaletter og seks motiver kan kombineres med gjenstander, snøfall, bris og stjerneblinking. Redigeringen bruker appens lilla stil; mottakerkalenderen følger valgt tema. Datolåsen har lenke og lås, og lukene åpnes med en døranimasjon. Redusert bevegelse respekteres. PWA kan legges på hjemskjermen.

Gavekortkjøp, kontroll av saldo og leverandørintegrasjon er ikke implementert. Bilder komprimeres lokalt og lagres med dokumentet; samlet arbeidsområde er begrenset til 15 MB i klienten. YouTube kontaktes først ved avspilling.

## Kontroller

```bash
npm run check
```

Kjører typekontroll, enhetstester, databasekontroller og produksjonsbygg. Databasekontrollen bruker en separat Postgres-instans i minnet med Supabase-lignende roller og JWT-identitet. Den kjører den faktiske migrasjonen og `supabase/tests/accounts.sql`. Testene dekker eierisolasjon, mottakertilgang, fremtidige luker, serverretting av quiz, fremdrift, oppdateringer, revisjonskonflikt og tilbakekalling. Alle testdata rulles tilbake.

Denne kontrollen erstatter ikke en ende-til-ende-test av Supabase Auth, e-postlevering og Realtime-transport. Slike kontroller må også gjøres i det tilkoblede prosjektet før ordinær lansering.

## GitHub og Vercel

Vercel bygger automatisk fra `main`. Bruk Next.js, repoets rot som Root Directory, `npm ci` og `npm run build`. Behold standard Output Directory. Ikke last opp `node_modules`, `.next` eller `.env.local`.

I VS Code kan **Sync Changes** hente nye commits. Egne filendringer må først lagres og committes før de pushes.

## Viktige filer

| Fil                                 | Innhold                                       |
| ----------------------------------- | --------------------------------------------- |
| src/components/account-panel.tsx    | Konto, innlogging og passord                  |
| src/components/account-provider.tsx | Innlogget bruker og gjenoppretting            |
| src/components/provider.tsx         | Lokal lagring, konto og synkronisering        |
| src/lib/cloud/workspace.ts          | Endringssett, revisjoner og utkast            |
| src/components/share-dialog.tsx     | Delingslenke og tilbakekalling                |
| src/app/receive/page.tsx            | Mottak av invitasjon og eldre prøvelenker     |
| src/components/recipient-view.tsx   | Luker, fremdrift og mottakerquiz              |
| supabase/migrations                 | Versjonert databaseoppsett                    |
| supabase/tests/accounts.sql         | Databasekontroll med midlertidige testbrukere |

Se [videre utvikling](docs/neste-steg.md) og [prøveplan](docs/proveplan.md).
