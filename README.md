# Luke · digital adventskalender

En mobiltilpasset adventskalender bygget med Next.js, React og TypeScript. Dempet lilla, lyse flater og gjennomsiktige glassknapper. GitHub-repo: https://github.com/martiinjohnsen/Digital-kalender. Publisert via Vercel på https://digitalkalender.vercel.app.

## Start lokalt

Åpne prosjektmappen i VS Code og kjør:

```bash
npm ci
npm run dev
```

Åpne http://localhost:3001. Bruk Node.js 24 eller nyere. Kalenderinnhold lagres i nettleseren på enheten, ikke automatisk hos Vercel.

## Funksjoner

- Mine kalendere er startsiden, med oppretting, fremdrift, søk, sortering og filtrene Alle, Laget av meg og Delt med meg.
- To steg for å opprette kalender: navn, mottaker, avsender og år, deretter utseende.
- Ni fargetemaer og seks motiver: hus, hytte, byhus, vinterpark, granskog og juleby. Gjenstander og animasjoner velges separat, med snømann, reinsdyr, grantrær, lys, snøfall, vinterbris og blinkende stjerner. Kan endres under Utseende i kalenderinnstillingene.
- 24 luker med tekst, komprimerte bilder, YouTube, HTTPS-lenker, opplevelser og manuelt innlagte gavekort.
- Datoen er lukens overskrift. Redigeringen bruker appens lilla farger, mens forhåndsvisning og mottakerkalender følger kalenderens eget tema.
- Vedlegg er egne innholdsbokser. De kan fjernes, legges tilbake og dras i rekkefølge på mobil og datamaskin. Boksene krymper til overskrifter under draoperasjonen, og mottakeren ser den lagrede rekkefølgen. Håndtaket støtter også piltaster.
- Gavekort har butikk, beløp, kode, innløsningslenke og utløpsdato. Ingen kjøps- eller leverandørintegrasjon foreløpig.
- Valgfrie quizspørsmål inne i hver luke, også sammen med gavekort eller annet innhold. Inntil 12 svaralternativer, ett eller flere riktige svar, eller fritekstsvar med godkjente svarvarianter. Kommentarer vises med avsenders navn etter innsending.
- Mottakerens quizoversikt viser besvart og riktig per dag. Fremdrift lagres lokalt. Eiers prøvesvar er adskilt fra mottakerens.
- Døranimasjon med sentrert tall. Snø, stjerner eller konfetti velges i et eget felt nederst i lukeredigeringen, med forhåndsvisning og avspilling på nytt. Redusert bevegelse respekteres.
- Datoåpning etter norsk tid. Fremtidige luker rister og viser lenke, lås og åpningsdato. En åpen luke har bare retur til kalenderen.
- Inspirasjon med innholdsideer, uten malvelger. Nye installasjoner starter tomme. Eldre kalendere og spørsmål bevares.
- Lokal IndexedDB-lagring, sikkerhetskopiering i JSON og validering før import. Inntil 100 kalendere og 15 MB samlet innhold.
- Små kalendere kan deles som prøvelenker. Mottakeren kan lagre kopien i Delt med meg.
- Installerbar PWA med appikoner og frakoblet reservevisning.

## Deling og lagring

Prøvelenken inneholder **hele kalenderkopien**. Datoåpningen i grensesnittet er ikke en sikker sperre mot å lese fremtidig innhold. Ikke bruk prøvelenker til ekte gavekortkoder eller private opplysninger. Vanlig publisering med sikker datolås krever en server som holder tilbake fremtidig innhold. Senere endringer fra avsender følger ikke automatisk med i delte kopier.

Kontoer, synkronisering, sikker publisering, gavekortkjøp og felles poengtavle er neste steg. Gavekortets gyldighet og saldo kontrolleres ikke av Luke. Ta sikkerhetskopi før du bytter enhet eller sletter nettleserdata. YouTube kontaktes først når spilleren trykker på videoen.

## GitHub og Vercel

Etter en endring i VS Code:

```bash
git add .
git commit -m "Oppdater kalenderen"
git push
```

Vercel bygger automatisk fra main. Velg Next.js som rammeverk, roten av repoet som Root Directory, `npm ci` for installasjon og `npm run build` for bygg. Behold standard Output Directory. Kildekoden skal ligge i roten av repoet, uten en ekstra luke-mappe. Ikke last opp node_modules, .next eller miljøfiler.

## Kontroller

```bash
npm run check
```

Dette kjører typekontroll, 29 automatiske tester og produksjonsbygg. Reglene for norsk midnatt, gavekort, spørsmål, bakoverkompatibilitet, delte kopier, quizpoeng, innholdsoversikt, import og trygge lenker er testet.

Se [prøveplan](docs/proveplan.md) og [videre utvikling](docs/neste-steg.md).

## Koden

| Sted                                 | Innhold                              |
| ------------------------------------ | ------------------------------------ |
| src/app                              | Sider, metadata, PWA og CSS          |
| src/components/calendar-library.tsx  | Mine kalendere                       |
| src/components/calendar-editor.tsx   | Luker og kalenderinnstillinger       |
| src/components/door-editor.tsx       | Innhold i en luke                    |
| src/components/recipient-view.tsx    | Datoåpning, gavekort og quizvisning  |
| src/components/appearance-picker.tsx | Farger, hus og scene                 |
| src/lib/model.ts                     | Datamodell, validering og datoregler |
| src/lib/quiz-progress.ts             | Poeng og stabile spørsmålsnøkler     |
| src/lib/calendar-library.ts          | Filtrering og delte kalenderkopier   |
| src/lib/storage.ts                   | IndexedDB og bildebehandling         |
| src/lib/share.ts                     | Prøvelenker                          |

## Navnet

Navnesøk ble sjekket 4. november 2026. luke.no var opptatt. Foretaksnavnet luke ble vist som ledig, mens varemerket ble vist som «kan være ledig» med fem treff. Dette er ikke en endelig avklaring av rettighetene til produktnavnet. Se https://navnesok.no/.
