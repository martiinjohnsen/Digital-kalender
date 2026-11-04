import {
  createCalendar,
  emptyDoor,
  type AdventCalendar,
  type AppData,
  type Door,
  type Theme,
} from "./model.ts";
export type TemplateId = "family" | "team" | "love" | "calm";
export const templates: {
  id: TemplateId;
  title: string;
  label: string;
  description: string;
  theme: Theme;
  icon: "heart" | "coffee" | "sparkles" | "leaf";
}[] = [
  {
    id: "family",
    title: "Sammen er det jul",
    label: "Familie og venner",
    description:
      "Små tradisjoner, gode minner og litt latter. For de du aller helst deler jula med.",
    theme: "advent",
    icon: "heart",
  },
  {
    id: "team",
    title: "Førjul på jobben",
    label: "Kollegaer",
    description:
      "Kaffepauser, en uhøytidelig quiz og små ting som gjør arbeidsdagen hyggeligere.",
    theme: "berry",
    icon: "coffee",
  },
  {
    id: "love",
    title: "Bare oss to",
    label: "En du er glad i",
    description: "24 anledninger til å si, huske og gjøre noe fint sammen.",
    theme: "night",
    icon: "sparkles",
  },
  {
    id: "calm",
    title: "En roligere desember",
    label: "Litt egentid",
    description:
      "Pusterom, små gleder og en påminnelse om at det enkle ofte er nok.",
    theme: "gingerbread",
    icon: "leaf",
  },
];
const messages: Record<TemplateId, [string, string][]> = {
  family: [
    [
      "Nå begynner det",
      "24 dager. Litt mindre hastverk, litt mer tid sammen. I dag: send en hyggelig melding til en du ikke har snakket med på en stund.",
    ],
    [
      "Kakao smaker best sammen",
      "Finn frem den største koppen, lag kakao og sett dere ned i ti minutter. Ingen planer, bare en liten pause sammen.",
    ],
    [
      "Et minne som varmer",
      "Hva er ditt fineste juleminne? Del det rundt middagsbordet i dag. Kanskje dere starter en ny tradisjon.",
    ],
    [
      "Jul på øret",
      "Lag en liten spilleliste sammen. Alle får velge én sang. Ingen får klage på valgene!",
    ],
    [
      "En liten bakestund",
      "Bak noe sammen. Pepperkaker, boller eller ferdig deig teller akkurat like mye. Det viktigste er hvem du baker med.",
    ],
    [
      "Takk for deg",
      "Dagens lille oppdrag: fortell én person noe helt konkret du setter pris på ved dem.",
    ],
    [
      "En tur under stjernene",
      "Ta på varme klær og gå en liten kveldstur. Se etter julelys, og ta den veien dere vanligvis ikke går.",
    ],
    [
      "Ingen skal være alene",
      "Tenk på noen som kanskje kunne trenge litt ekstra omtanke i desember. En telefon eller en invitasjon kan bety mye.",
    ],
    [
      "Sofakveld",
      "Finn en julefilm dere begge liker. Legg vekk mobilen, hent et pledd og gjør det enkelt.",
    ],
    [
      "En duft av jul",
      "Skrell en klementin. Tenn et lys. Pust ut. Noen ganger er det alt som trengs.",
    ],
    [
      "En liten overraskelse",
      "Gjør en liten tjeneste for noen uten å si ifra. Ta oppvasken, fyll kaffekoppen eller legg igjen en hyggelig lapp.",
    ],
    [
      "God jul, kjære deg",
      "Takk for alle de små øyeblikkene. Håper du får en jul med varme, latter og plass til å bare være deg. God jul!",
    ],
  ],
  team: [
    [
      "Hei, desember!",
      "La oss gjøre årets siste måned litt hyggeligere. I dag: si hei til en kollega du ikke snakker med så ofte.",
    ],
    [
      "En kaffe uten agenda",
      "Inviter en kollega til ti minutter med kaffe eller te. Jobbprat er valgfritt.",
    ],
    [
      "En liten takk",
      "Send en takk til noen som har gjort arbeidshverdagen din enklere i år. Vær konkret!",
    ],
    [
      "Din beste anbefaling",
      "Del en bok, podkast eller serie du liker. Kanskje en kollega finner en ny favoritt.",
    ],
    [
      "Lunsj sammen",
      "Finn et felles bord til lunsj i dag. Spør noen hvordan de egentlig har det.",
    ],
    [
      "Små seire teller",
      "Hva fikk dere til sammen i år? Velg en liten seier som fortjener litt ekstra oppmerksomhet.",
    ],
    [
      "Ta en beinstrekk",
      "Reis deg, strekk deg og ta gjerne med en kollega ut i fem minutter.",
    ],
    [
      "Hvem er du utenfor jobb?",
      "Fortell en kollega om en hobby eller interesse de kanskje ikke kjenner til.",
    ],
    [
      "Et vennlig avbrekk",
      "Legg en hyggelig lapp på et skrivebord eller send en liten oppmuntring i chatten.",
    ],
    [
      "Godt samarbeid",
      "Hva gjør teamet deres bra? Del én ting du vil ta med deg inn i neste år.",
    ],
    [
      "Rydd litt plass",
      "Sett av ti minutter til å avslutte en liten oppgave. Gi deg selv litt mer ro før jul.",
    ],
    [
      "Takk for i år",
      "Takk for innsatsen, kaffepausene og alt dere får til sammen. God jul og en velfortjent pause!",
    ],
  ],
  love: [
    [
      "Denne er til deg",
      "Jeg ville gi deg noe lite å glede deg til hver dag. Her er den første av 24 små hilsener. Jeg er glad i deg.",
    ],
    [
      "En liten date",
      "Velg en kveld denne uka. Jeg ordner noe varmt i koppen, du velger filmen.",
    ],
    [
      "Husker du?",
      "Tenk på et øyeblikk vi lo skikkelig sammen. Fortell meg hvilket du tenkte på.",
    ],
    [
      "Min favoritt ved deg",
      "Noe av det fineste med deg er hvordan du får andre til å føle seg sett. I dag håper jeg du kjenner det selv.",
    ],
    [
      "En sang til oss",
      "Finn en sang som minner deg om oss. Spill den høyt nok til at vi må danse litt.",
    ],
    [
      "Ingen stor plan",
      "La oss gå en liten tur. Ingen destinasjon. Bare oss og litt frisk luft.",
    ],
    [
      "Frokostønske",
      "I dag får du velge: sen frokost, en god kaffe eller begge deler. Vi finner en dag som passer.",
    ],
    [
      "En liten liste",
      "Tre ting jeg gleder meg til med deg: flere hverdagseventyr, flere dårlige vitser og mer tid sammen.",
    ],
    [
      "Helt vanlig, helt fint",
      "En helt vanlig kveld med deg er også noe jeg setter pris på. Det trenger ikke være mer.",
    ],
    [
      "Til senere",
      "Skriv ned ett sted vi har lyst til å besøke sammen. Det kan være så nært eller langt unna vi vil.",
    ],
    [
      "Et lite frikort",
      "Du velger middagen neste gang. Jeg tar oppvasken. Dette kan du spare til en dag du trenger det.",
    ],
    [
      "Min fineste julegave",
      "Det fineste er alle de små øyeblikkene med deg. Takk for at du er du. God jul, kjære deg.",
    ],
  ],
  calm: [
    [
      "En desember i ditt tempo",
      "Du trenger ikke rekke alt. I dag holder det å gjøre én liten ting som er god for deg.",
    ],
    [
      "Varm kopp, rolig stund",
      "Lag noe varmt å drikke. Sett deg ved vinduet og la mobilen ligge et annet sted i fem minutter.",
    ],
    [
      "Litt frisk luft",
      "Ta en kort tur ut. Legg merke til tre ting du vanligvis ikke ser.",
    ],
    [
      "Godt nok er godt",
      "Velg én ting du kan gjøre enklere i dag. Ferdigkjøpte pepperkaker er også pepperkaker.",
    ],
    [
      "En sang du liker",
      "Spill en sang som gjør deg glad. Hør den ferdig uten å gjøre noe annet.",
    ],
    [
      "Plass til en pause",
      "Du trenger ikke fortjene hvile. Sett av et kvarter til akkurat det du har lyst til.",
    ],
    [
      "Tre små ting",
      "Skriv ned tre små ting som har vært fine denne uka. Det trenger ikke være noe stort.",
    ],
    [
      "En mindre ting",
      "Si nei til én ting du egentlig ikke har kapasitet til. Du bestemmer hvor mye desember skal inneholde.",
    ],
    [
      "Noe med hendene",
      "Tegn, bak, strikk eller pakk inn en gave. Gjør én ting i et rolig tempo.",
    ],
    [
      "Tidlig kveld",
      "Gjør det litt behagelig rundt deg i kveld. En god bok, et pledd eller rett og slett en tidlig natt.",
    ],
    [
      "Et vennlig ord",
      "Snakk til deg selv som du ville snakket til en god venn. Du gjør mye som er bra.",
    ],
    [
      "En fredelig jul",
      "Uansett hvordan jula di ser ut: jeg håper den rommer noe godt for deg. God jul, og takk for at du tok deg tid.",
    ],
  ],
};
const quizDays = new Set([4, 10, 16, 22]);
export const questions = [
  {
    title: "Hvilket land forbindes pepperkakehuset med?",
    options: ["Tyskland", "Italia", "Island"],
    answerIndex: 0,
    explanation:
      "Pepperkakehus forbindes særlig med tysk juletradisjon og eventyret om Hans og Grete.",
  },
  {
    title: "Hva heter reinsdyret med den røde nesen?",
    options: ["Rudolf", "Bambi", "Sven"],
    answerIndex: 0,
    explanation: "Rudolf lyser opp veien med den røde nesen sin.",
  },
  {
    title: "Hvor mange søndager er det i advent?",
    options: ["Tre", "Fire", "Fem"],
    answerIndex: 1,
    explanation: "Advent har fire søndager før første juledag.",
  },
  {
    title: "Hva er riskrem laget med?",
    options: ["Havregrøt", "Semulegrøt", "Risgrøt"],
    answerIndex: 2,
    explanation: "Riskrem lages av kald risgrøt blandet med pisket krem.",
  },
];
export function templateDoors(id: TemplateId): Door[] {
  return Array.from({ length: 24 }, (_, i): Door => {
    const day = i + 1;
    if (quizDays.has(day)) {
      const q = questions[[4, 10, 16, 22].indexOf(day)];
      return {
        day,
        kind: "quiz",
        title: q.title,
        body: "En liten julequiz. Hva tror du?",
        quiz: {
          options: [...q.options],
          answerIndex: q.answerIndex,
          explanation: q.explanation,
        },
      };
    }
    const index = day === 24 ? 11 : Math.floor(i / 2) % 11;
    const [title, body] = messages[id][index];
    return {
      day,
      kind: [2, 5, 7, 12, 15, 19, 23].includes(day) ? "activity" : "message",
      title,
      body,
    };
  });
}
export function initialData(): AppData {
  return { version: 1, preferences: { name: "", snow: true }, calendars: [] };
}
export const ideas = [
  {
    kind: "giftcard" as const,
    title: "Et gavekort på noe godt",
    body: "For eksempel 100 kr til matlevering 4. desember. Legg inn et gavekort du allerede har, med kode eller lenke.",
    icon: "gift" as const,
  },
  {
    kind: "message" as const,
    title: "En liten takk",
    body: "Fortell om noe mottakeren gjorde i år som du fortsatt setter pris på.",
    icon: "heart" as const,
  },
  {
    kind: "activity" as const,
    title: "Kakao og en kveldstur",
    body: "Inviter på en liten tur med noe varmt på termos. Det enkle er ofte det fineste.",
    icon: "coffee" as const,
  },
  {
    kind: "image" as const,
    title: "Et bilde med en historie",
    body: "Finn frem et bilde fra et fint øyeblikk. Skriv hvorfor akkurat dette minnet betyr noe.",
    icon: "image" as const,
  },
  {
    kind: "quiz" as const,
    title: "Hvor godt kjenner du oss?",
    body: "Lag en quiz om noe dere har opplevd sammen. Interne vitser er absolutt lov.",
    icon: "quiz" as const,
  },
  {
    kind: "activity" as const,
    title: "Et lite gavekort på tid",
    body: "Gi bort en middag, hjelp til noe praktisk eller en kveld helt uten planer.",
    icon: "gift" as const,
  },
  {
    kind: "video" as const,
    title: "En sang som sier det",
    body: "Del en sang fra YouTube som minner deg om mottakeren. Fortell hvorfor du valgte den.",
    icon: "video" as const,
  },
];
