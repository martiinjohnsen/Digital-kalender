# Bilder, lyd og hilsener tilbake

Kjør `migrations/202611070001_media_greetings.sql` og deretter `migrations/202611070002_preview_greetings.sql` i SQL-editoren i det samme Supabase-prosjektet som appen bruker. Publiser deretter appoppdateringen. På et prosjekt som allerede har fillagring, trenger bare den siste migreringen kjøres. SQL-en kan kjøres på nytt. Den sletter ikke kalendere, invitasjoner, prøvesvar eller fremdrift.

Oppdateringskommandoen kontrollerer at oppsettet er installert før den publiserer. Ved behov kopierer den SQL-en til utklippstavlen og åpner SQL-editoren. Erstatt innholdet i kodefeltet med SQL-en og trykk **Run**. La terminalen stå åpen. Den kontrollerer oppsettet på nytt og fortsetter automatisk.

## Hva som lagres

- Nye bilder og lydfiler ligger i den private Storage-bøtten `luke-media`. Kalenderdataene inneholder stabile filreferanser, aldri tidsbegrensede nedlastingslenker.
- Eldre innebygde bilder beholdes. De flyttes til fillagring når den aktuelle kalenderen lagres. Kopier og importer får egne vedlegg under sine nye kalender-ID-er.
- Nedlastede sikkerhetskopier inkluderer selve bildene og lydfilene og kan importeres igjen. Maksimal sikkerhetskopistørrelse er 100 MB.
- En hilsen tilhører én mottaker og én luke. Avsender ser sendte hilsener, mens øvrige mottakere ikke har tilgang. Avsender ser heller ikke usendte vedlegg.
- Førstegangstilbudet om å sende en hilsen lagres på kontoen. En lukket invitasjon dukker ikke opp igjen neste gang på en annen enhet.
- Eieren kan prøve hilsener i forhåndsvisningen. De merkes «Prøvehilsen» i redigeringen og blir aldri ekte mottakerhilsener. Med «Lagre fremdrift» på lagres de separat under eierens prøvefremdrift, inkludert prompt, revisjon og lesestatus. De to prøvemodusene holdes adskilt. Med valget av brukes bare appøktens minne; «Start på nytt» eller en ny forhåndsvisning fjerner den midlertidige prøven. Å slå lagring av skjuler de lagrede prøvene, men sletter dem ikke. De kommer tilbake når lagringen slås på igjen.
- Vedlegg i prøvehilsener er private eieropplastinger. De knyttes ikke til kalenderdokumentet og kan ikke lastes ned av mottakere. Lagrede prøvevedlegg er også beskyttet mot opprydding når prøvevisningen er slått av.
- Oppdateringer sendes via Realtime, med oppfrisking ved fokus og hvert 30. sekund som reserve. Uleste merker følger revisjoner, slik at en ny endring blir ulest igjen.

## Grenser og vedlikehold

Opptak stopper etter tre minutter. Hver fil kan være opptil 8 MiB. Bilder komprimeres før opplasting. Kontoer kan opprette opptil 200 nye filreservasjoner per døgn og bruke opptil 250 MiB i vedlegg. Disse grensene er beskyttelse mot utilsiktet overforbruk, og erstatter ikke abonnementets samlede lagringskvote.

Gamle, ubrukte vedlegg ryddes etter minst ett døgn når brukeren er aktiv. Vedlegg som fortsatt brukes i en kalender eller sendt hilsen, beholdes. Filer endres aldri på stedet. Det beskytter andre enheter mot feil og gamle mellomlagrede filer. Ved manuell sletting av en hel Supabase-konto må eieren også fjerne brukerens Storage-filer gjennom Storage API-et eller kontrollpanelet.

## Kontroller før deling

Bruk to forskjellige Google-kontoer og en kalender med tilgjengelige luker. Kontroller bilde og opptak på telefon, avspilling fra den andre kontoen, redigering av en sendt hilsen og merket hos avsenderen. En tredje mottaker skal ikke kunne se den første mottakerens hilsen. Kontroller også at fremtidige luker fortsatt er låst og at gamle kalendere er intakte.

`npm run test:database` bruker bare en isolert PGlite-database med en modell av Storage-metadata og RLS. Den tester ikke faktisk filtransport, Realtime-nettverket eller en fysisk mikrofon. Testdata skrives aldri til det virkelige prosjektet.
