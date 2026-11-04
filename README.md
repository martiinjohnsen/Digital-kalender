# Luke · digital adventskalender

En mobiltilpasset base for personlige adventskalendere. Foreløpig produktnavn er **Luke**. Uttrykket bruker dempet adventslilla, lyse flater og glassknapper. Prosjektet er laget med Next.js App Router, React og TypeScript, og passer til GitHub → Vercel.

## Start på Macen

Åpne denne mappen i VS Code, og kjør i terminalen:

```bash
npm ci
npm run dev
```

Åpne **http://localhost:3001**. Port 3001 er valgt for å unngå å kollidere med andre prosjekter. Node.js 22.13 eller nyere kreves; Node.js 24 anbefales for dette prosjektet.

## Det som er på plass

- Hjemside med oppretting og oversikt, egen side for Mine kalendere, inspirasjon og innstillinger.
- Opprett kalender med navn, mottaker, avsender, år og fem visuelle temaer.
- Redigering skjer inne i den valgte kalenderen. Alle 24 luker har egen redigerer.
- Tekst, lokale bilder, valgfri YouTube-video, trygge HTTPS-lenker, opplevelser og spørsmål med svaralternativer.
- Snø, stjerner eller konfetti kan velges for hver luke.
- Døren åpnes med en kort 3D-animasjon, og visningen zoomer inn før innholdet kommer frem. Redusert bevegelse respekteres.
- Egen julequiz per kalender med opptil 30 spørsmål, 2–4 svaralternativer, riktig svar, forklaring, omorganisering, forhåndsvisning og poeng etter spillrunden.
- Fire komplette maler med 24 innholdsforslag hver. Du kan fylle bare de helt tomme lukene uten å overskrive uferdig innhold.
- Søk, sortering, filtrering, kopiering og sletting av kalendere med bekreftelse.
- Mottakervisning med datoåpning etter Europe/Oslo. Eieren kan prøve alle luker.
- Lokal lagring i IndexedDB med synlig lagringsstatus og feilbehandling.
- Eksport og import av sikkerhetskopier i JSON, med validering og gjennomgang før import.
- Prøvelenker for mindre kalendere uten store bilder.
- PWA-manifest, vanlige appikoner, maskable-ikon, installasjonsveiledning og service worker med frakoblet reservevisning.

## Hva denne basen ikke gjør ennå

Dette er en fungerende lokal førsteversjon. Den har **ikke** ekte brukerkontoer, skylagring, samarbeid, e-postutsending, betaling, pushvarsler eller en felles poengtavle. Quizresultater vises bare til spilleren i den aktuelle runden.

Kalenderinnhold lagres i nettleseren på enheten der det opprettes. Det lastes ikke automatisk opp til Vercel. Sletting av nettleserdata kan fjerne innholdet. Bruk sikkerhetskopiering før du bytter nettleser eller enhet. En samlet sikkerhetskopi støtter inntil 15 MB. Opplysninger om åpnede luker lagres som små lokale visningsvalg.

En prøvelenke inneholder hele kalenderkopien i URL-fragmentet. Den gir **ingen sikker sperre** mot å lese fremtidige luker, og senere endringer følger ikke med. Bildetunge kalendere må eksporteres som fil. Vanlig publisering med sikker datolås krever en server som bestemmer hvilket innhold mottakeren får tilgang til. Dette er forklart i delingsdialogen.

YouTube lastes først etter at mottakeren trykker på videoen. Bilder komprimeres på enheten; SVG og HTML-filer godtas ikke som bildeopplasting.

## Publiser med GitHub og Vercel

Det lokale prosjektet har riktig `origin`. Første opplasting fra den vanlige VS Code-terminalen gjøres med:

```bash
git push -u origin main
```

Hvis GitHub ber om innlogging, fullføres den med din egen konto i VS Code eller nettleseren. Kildekoden er ikke publisert før denne opplastingen har lykkes.

Repoet er `https://github.com/martiinjohnsen/Digital-kalender` og Vercel-prosjektet heter `digitalkalender`.

Kildekodefilene skal ligge i roten av repoet, uten en ekstra `luke/`-mappe rundt. Ikke last opp `node_modules`, `.next`, `.cache` eller lokale miljøfiler.

Vercel-innstillinger:

| Innstilling      | Verdi                |
| ---------------- | -------------------- |
| Framework        | Next.js              |
| Root Directory   | Roten av repoet      |
| Install Command  | `npm ci`             |
| Build Command    | `npm run build`      |
| Output Directory | Standard for Next.js |
| Node.js          | 24.x                 |

Når repoet og Vercel er koblet sammen, vil en push til `main` starte et nytt bygg. HTTPS på Vercel gjør det mulig å installere nettsiden som en app. Den faktiske installasjonsdialogen varierer mellom nettlesere. Fullverdig App Store- eller Play Store-distribusjon er et eget steg.

## Kontroller

```bash
npm run typecheck
npm test
npm run build
# Eller alle tre:
npm run check
```

Testene kontrollerer blant annet norsk midnatt, ferdigstatus, bevaring av delvis innhold, maler, sikkerhetskopier, lenkevalidering, YouTube-verter og julequiz.

En vellykket bygg- og domenetest erstatter ikke testing av berøring, skjermleser, installasjon og animasjon i faktiske nettlesere. Se [manuell prøveplan](docs/proveplan.md).

## Finn frem i koden

| Mappe / fil            | Innhold                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `src/app/`             | Sider, metadata, PWA-manifest og global stil                       |
| `src/components/`      | Hjemside, navigasjon, redigerer, dialoger, quiz og mottakervisning |
| `src/lib/model.ts`     | Datamodell, regler, datoer og importvalidering                     |
| `src/lib/storage.ts`   | Lokal lagringsadapter og bildebehandling                           |
| `src/lib/templates.ts` | Maler og inspirasjon                                               |
| `src/lib/share.ts`     | Prøvelenker                                                        |
| `public/sw.js`         | Mellomlagring av appens offentlige skall                           |
| `tests/`               | Automatiske tester av sentrale regler                              |

Ved neste steg kan `repository`-adapteren byttes til API-basert lagring. Kalenderkomponentene bruker en felles dataleverandør, slik at grensesnittet kan beholdes når kontoer kobles til. Se [videre utvikling](docs/neste-steg.md).
