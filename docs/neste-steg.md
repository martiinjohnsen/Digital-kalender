# Videre utvikling

## Før registrering åpnes for alle

Koble en e-posttjeneste til Supabase Auth. Velg avsender, bekreft eventuelt domene hos leverandøren og legg SMTP-innstillingene i Supabase. Behold e-postbekreftelse. Se https://supabase.com/docs/guides/auth/auth-smtp.

Test hele kjeden med to separate testkontoer: registrering, bekreftelse, innlogging, glemt passord, endring av passord og utlogging. Test e-postlevering til en adresse utenfor Supabase-prosjektteamet. Sett deretter `NEXT_PUBLIC_AUTH_EMAIL_READY=true` og bygg appen på nytt.

Kontroller også deling mellom to faktiske innlogginger: eier redigerer en kalender, mottaker ser oppdateringen, kan ikke redigere, kan ikke hente fremtidige luker og mister tilgang når delingen avsluttes. Test samme konto på to enheter, samt utkast ved frakobling og samtidige kalenderendringer.

## Det som allerede er implementert

Konto-grensesnitt, Supabase Auth-klient, kontoavgrenset lagring, eksplisitt import fra lokal lagring, database-RLS, lesetilgang for mottakere, tilbakekallbare invitasjoner, serverstyrt datoåpning, serverretting av quiz, personlig fremdrift, revisjonskontroll og Realtime-abonnementer.

Migrasjonen ble opprettet i det tilkoblede Supabase-prosjektet. Site URL og returadressene for kontosiden ble satt opp. Databasekontrollene er kjørt lokalt med den samme migrasjonen; ekstern tilgang uten innlogging er kontrollert mot Supabase. SMTP, full e-postflyt og faktisk Realtime mellom to brukere gjenstår å verifisere.

## Bilder og video

Bilder ligger foreløpig komprimert i kalenderdokumentet. Neste steg er en privat objektlagring med filgrenser og tilgangskontroll, slik at større bildebibliotek ikke lastes hver gang. Ekte videoopplasting er et eget arbeid; nå brukes YouTube-lenker.

## Gavekort

Manuelle gavekort støttes. Leverandørkjøp krever blant annet betaling, utstedelse, levering og refusjon. Leverandørnøkler skal aldri inn i nettleseren. Mottakerens tilgang til gavekortkoder må fortsatt følge kalenderens serverstyrte datolås.

## Profil og app

Endelig logo og grafisk profil er utsatt etter ønske. PWA er lagt til. Pushvarsler, kontosletting med gjennomgåbar konsekvens, eventuell appbutikkpakke og felles quizpoengtavle er separate neste steg.
