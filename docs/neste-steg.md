# Neste steg

## 1. Prøv basen

Test først oppretting, redigering, temaer, quiz og mottakervisning på en faktisk mobil. Bestem endelig produktnavn før domene, kontoavsender og grafisk profil låses.

## 2. Konto og synkronisering

Legg til en innloggingstjeneste og database. `repository` i `src/lib/storage.ts` er dagens grense mellom grensesnitt og lagring. Gjør dataleverandøren kontoavhengig og håndhev kalenderrettigheter på serveren. Hemmelige nøkler skal ikke ligge i klientkode eller i variabler som starter med `NEXT_PUBLIC_`.

Forslag til data som må modelleres: brukere, kalendere, eier-/samarbeidsroller, luker, mediefiler, mottakertilgang, quizspørsmål og innsendte svar. Bruk egne migrasjoner og stabile versjoner av lagringsformatet. Import av dagens lokale kalendere bør være en eksplisitt, gjennomgåbar handling etter innlogging.

## 3. Ordinær publisering

Opprett et offentlig kalender-ID med serverstyrt tilgang. Fremtidige lukers innhold skal ikke sendes til mottakeren før de åpner. Dato og tillatelser må vurderes på serveren, ikke bare i JavaScript. Gi deling mulighet for tilbakekalling. Det er dette som erstatter prøvelenkene.

## 4. Medier

Flytt bilder til en objektlagring med størrelsesgrenser, rettighetskontroll og bildebehandling. Bruk signerte opplastinger. Behold synlig opplastingsstatus og alternativ bildetekst.

## 5. Julequiz med felles poeng

Lagre forsøk og poeng serverbasert. Riktige svar skal ikke følge med i klientens spørsmålsdata før innsending dersom poengene skal brukes i en konkurranse. Bestem om man kan prøve flere ganger, hvordan navn vises og når resultater publiseres.

## 6. App

PWA er første steg og er allerede lagt til. Test hjemskjermikon, skjermstørrelser og frakoblet oppførsel. Ekte pushvarsler krever samtykke, abonnementer og en server som sender varsler. En eventuell appbutikkpakke kommer etter at kontoer og synkronisering fungerer.

## Teknisk vedlikehold

Basen bruker de installerte, lokalt tilgjengelige versjonene av Next.js og React. Før ordinær produksjonsbruk: oppdater til gjeldende støttede versjoner, oppdater låsefilen og kjør alle kontrollene på nytt. Ikke endre versjoner uten å gjøre et nytt bygg. Service workerens cache-navn bør endres ved større endringer i appskallet.

## Gavekort

Lukene har nå et eget giftCard-objekt og en manuell visning. Før leverandørintegrasjon må kjøp, utstedelse, betalingsbekreftelse, levering, saldo og refusjon modelleres. Hold ekte gavekortkoder serverbasert, med tilgang bare for mottakeren etter riktig dato. Ikke legg leverandørnøkler eller aktive gavekort i klientkode eller prøvelenker.
