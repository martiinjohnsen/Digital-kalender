import test from "node:test";
import assert from "node:assert/strict";
import {
  availableDay,
  completedCount,
  calendarContentSummary,
  createCalendar,
  hasDoorContent,
  isCalendar,
  isCalendarQuiz,
  isDoorComplete,
  parseBackup,
  safeLink,
  youtubeId,
  DEFAULT_SCENE,
  DOOR_EFFECTS,
  THEMES,
  correctChoices,
  normalizeAnswer,
  isQuizResponseCorrect,
  isQuestionComplete,
  doorBlockOrder,
  moveDoorBlock,
  removeDoorBlock,
  type QuizQuestion,
  type DoorBlockKind,
  questionsForDoor,
} from "../src/lib/model.ts";
import { initialData, questions, templateDoors } from "../src/lib/templates.ts";
import { decodeCalendar, encodeCalendar } from "../src/lib/share.ts";
import {
  libraryCalendars,
  receivedCopy,
  ownerCopy,
} from "../src/lib/calendar-library.ts";
import {
  parseQuizProgress,
  questionKey,
  quizSummary,
} from "../src/lib/quiz-progress.ts";
const make = () =>
  createCalendar({
    title: "Jul med æ, ø og å 🎄",
    recipient: "Familien",
    sender: "En venn",
    year: 2026,
    theme: "advent",
  });

test("all opening effects survive sharing and backup import; unknown effects are rejected", () => {
  for (const effect of DOOR_EFFECTS) {
    const calendar = make();
    calendar.doors[0].effect = effect;
    assert.equal(isCalendar(calendar), true, effect);
    assert.equal(decodeCalendar(encodeCalendar(calendar)).doors[0].effect, effect);
    const data = { ...initialData(), calendars: [calendar] };
    assert.equal(parseBackup(JSON.stringify(data)).calendars[0].doors[0].effect, effect);
  }
  const invalid = make();
  Object.assign(invalid.doors[0], { effect: "unsupported" });
  assert.equal(isCalendar(invalid), false);
});

test("new calendars contain exactly one door for every December day", () => {
  const calendar = make();
  assert.equal(isCalendar(calendar), true);
  assert.deepEqual(
    calendar.doors.map((door) => door.day),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  assert.equal(completedCount(calendar), 0);
});
test("the date lock changes at Norwegian midnight, not the device's time zone", () => {
  assert.equal(availableDay(2026, new Date("2026-11-30T22:59:59Z")), 0);
  assert.equal(availableDay(2026, new Date("2026-11-30T23:00:00Z")), 1);
  assert.equal(availableDay(2026, new Date("2026-12-10T22:59:59Z")), 10);
  assert.equal(availableDay(2026, new Date("2026-12-10T23:00:00Z")), 11);
  assert.equal(availableDay(2026, new Date("2026-12-31T15:00:00Z")), 24);
  assert.equal(availableDay(2026, new Date("2027-01-01T00:00:00Z")), 24);
  assert.equal(availableDay(2027, new Date("2026-12-20T00:00:00Z")), 0);
});
test("partial custom content is preserved when filling empty doors", () => {
  const calendar = make();
  calendar.doors[0].body = "Min uferdige hilsen";
  const suggestions = templateDoors("family");
  const result = calendar.doors.map((door) =>
    hasDoorContent(door) ? door : suggestions[door.day - 1],
  );
  assert.equal(result[0].body, "Min uferdige hilsen");
  assert.equal(result[0].title, "");
  assert.equal(result.filter(isDoorComplete).length, 24);
});
test("each template contains 24 usable, valid doors", () => {
  for (const id of ["family", "team", "love", "calm"] as const) {
    const calendar = { ...make(), doors: templateDoors(id) };
    assert.equal(isCalendar(calendar), true);
    assert.equal(completedCount(calendar), 24);
    assert.equal(calendar.doors[23].day, 24);
  }
});
test("backup parsing rejects invalid days, duplicate calendar IDs and unsupported data", () => {
  const data = { ...initialData(), calendars: [make()] };
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
  const corrupt = structuredClone(data);
  corrupt.calendars[0].doors[0].day = 2;
  assert.throws(() => parseBackup(JSON.stringify(corrupt)), /ugyldig/);
  assert.throws(
    () =>
      parseBackup(
        JSON.stringify({
          ...data,
          calendars: [data.calendars[0], data.calendars[0]],
        }),
      ),
    /ugyldig/,
  );
  assert.throws(() => parseBackup("<html>not a backup</html>"), /gyldig/);
  assert.throws(
    () => parseBackup(JSON.stringify({ ...data, version: 99 })),
    /ugyldig/,
  );
});
test("share links round-trip Norwegian text, emojis, media references and the calendar quiz", () => {
  const calendar = {
    ...make(),
    doors: templateDoors("family"),
    quiz: {
      title: "Julequiz",
      description: "Litt juleglede!",
      questions: structuredClone(questions),
    },
  };
  calendar.doors[0].effect = "sparkles";
  calendar.doors[0].link = { label: "Se mer", url: "https://example.com/jul" };
  assert.deepEqual(decodeCalendar(encodeCalendar(calendar)), calendar);
});
test("share link validation rejects malformed and oversized payloads", () => {
  assert.throws(() => decodeCalendar(""), /ugyldig/);
  assert.throws(() => decodeCalendar("%%%"), /ugyldig/);
  assert.throws(() => decodeCalendar("e30"), /kunne ikke åpne/);
  assert.throws(() => decodeCalendar("A".repeat(20001)), /stor/);
  const calendar = make();
  calendar.doors[0].body = "a".repeat(15000);
  assert.throws(() => encodeCalendar(calendar), /for stor/);
});
test("external links reject scripts, insecure protocols and embedded credentials", () => {
  assert.equal(
    safeLink("https://example.com/path?q=ok"),
    "https://example.com/path?q=ok",
  );
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "http://example.com",
    "https://user:password@example.com",
  ])
    assert.equal(safeLink(url), null);
  const calendar = make();
  calendar.doors[0].link = { label: "Click", url: "javascript:alert(1)" };
  assert.equal(isCalendar(calendar), false);
});
test("video embedding accepts exact YouTube hosts only", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeId("https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ"),
    null,
  );
  assert.equal(youtubeId("http://youtu.be/dQw4w9WgXcQ"), null);
  assert.equal(youtubeId("https://youtu.be/not-valid"), null);
});
test("calendar quizzes require complete options and a valid correct answer", () => {
  const quiz = {
    title: "Jul",
    description: "En quiz",
    questions: structuredClone(questions),
  };
  assert.equal(isCalendarQuiz(quiz), true);
  quiz.questions[0].answerIndex = 99;
  assert.equal(isCalendarQuiz(quiz), false);
  quiz.questions[0].answerIndex = 0;
  quiz.questions[0].options[1] = " ";
  assert.equal(isCalendarQuiz(quiz), false);
});
test("a new workspace starts without example calendars", () => {
  const data = initialData();
  assert.deepEqual(data.calendars, []);
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
});
test("image and video doors are complete only when their media is present", () => {
  const door = {
    day: 1,
    kind: "image" as const,
    title: "Et minne",
    body: "En tekst",
  };
  assert.equal(isDoorComplete(door), false);
  assert.equal(
    isDoorComplete({ ...door, image: "data:image/jpeg;base64,AAAA" }),
    true,
  );
  assert.equal(
    isDoorComplete({
      ...door,
      kind: "video",
      videoUrl: "https://example.com/video",
    }),
    false,
  );
});

test("effects and calendar quiz attachments are not treated as untouched doors", () => {
  const calendar = make();
  assert.equal(
    hasDoorContent({ ...calendar.doors[0], effect: "sparkles" }),
    true,
  );
  assert.equal(
    hasDoorContent({ ...calendar.doors[0], showCalendarQuiz: true }),
    true,
  );
  assert.equal(hasDoorContent({ ...calendar.doors[0], effect: "none" }), false);
});
test("an attached calendar quiz must exist, and completes a titled door", () => {
  const calendar = make();
  calendar.doors[0] = {
    ...calendar.doors[0],
    title: "Dagens julequiz",
    showCalendarQuiz: true,
  };
  assert.equal(isCalendar(calendar), false);
  calendar.quiz = {
    title: "Jul",
    description: "En quiz",
    questions: structuredClone(questions),
  };
  assert.equal(isCalendar(calendar), true);
  assert.equal(isDoorComplete(calendar.doors[0]), true);
});

test("gift cards require a merchant, positive amount and code or HTTPS redemption link", () => {
  const calendar = make();
  const door = calendar.doors[3];
  door.kind = "giftcard";
  door.title = "Middagen er på meg";
  door.giftCard = {
    merchant: "Matlevering",
    amount: 100,
    currency: "NOK",
    code: "TEST-100",
    url: "",
    expiresOn: "2027-12-31",
  };
  assert.equal(isDoorComplete(door), true);
  assert.deepEqual(
    decodeCalendar(encodeCalendar(calendar)).doors[3].giftCard,
    door.giftCard,
  );
  door.giftCard.code = "";
  assert.equal(isDoorComplete(door), false);
  door.giftCard.url = "https://example.com/gift";
  assert.equal(isDoorComplete(door), true);
  door.giftCard.amount = 0;
  assert.equal(isDoorComplete(door), false);
  door.kind = "message";
  door.body = "En hilsen med et uferdig gavekort";
  assert.equal(isDoorComplete(door), false);
  door.giftCard.url = "javascript:alert(1)";
  assert.equal(isCalendar(calendar), false);
  door.giftCard.url = "";
  door.giftCard.expiresOn = "2027-02-30";
  assert.equal(isCalendar(calendar), false);
});
test("quiz questions can accompany a gift, image or message, and drafts remain editable", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.title = "En hilsen og et spørsmål";
  door.body = "God desember!";
  door.questions = structuredClone(questions.slice(0, 2));
  assert.equal(isDoorComplete(door), true);
  assert.equal(isCalendar(calendar), true);
  door.questions[0].options[0] = "";
  assert.equal(isDoorComplete(door), false);
  assert.equal(isCalendar(calendar), true);
  door.questions[0].answerIndex = 99;
  assert.equal(isCalendar(calendar), false);
});
test("old backups keep legacy questions and scenes while new options survive a backup round trip", () => {
  const calendar = make();
  delete calendar.scene;
  delete calendar.access;
  calendar.doors = templateDoors("family");
  calendar.quiz = {
    title: "Eldre quiz",
    description: "",
    questions: structuredClone(questions),
  };
  calendar.doors[0].showCalendarQuiz = true;
  assert.equal(isCalendar(calendar), true);
  assert.equal(
    questionsForDoor(calendar.doors[0], calendar).length,
    questions.length,
  );
  for (const theme of THEMES) {
    calendar.theme = theme;
    calendar.scene = {
      ...DEFAULT_SCENE,
      house: "cabin",
      snowman: true,
      reindeer: true,
    };
    assert.equal(isCalendar(calendar), true);
    assert.deepEqual(
      parseBackup(JSON.stringify({ ...initialData(), calendars: [calendar] }))
        .calendars[0],
      calendar,
    );
  }
});
test("received calendars stay separate from owned originals and can be filtered or refreshed", () => {
  const owner = make();
  const received = receivedCopy(owner);
  assert.notEqual(received.id, owner.id);
  assert.equal(received.receivedSourceId, owner.id);
  const refreshed = receivedCopy({ ...owner, title: "Oppdatert" }, received);
  assert.equal(refreshed.id, received.id);
  assert.equal(refreshed.title, "Oppdatert");
  const data = [owner, received];
  assert.deepEqual(libraryCalendars(data, "owner"), [owner]);
  assert.deepEqual(libraryCalendars(data, "received"), [received]);
  assert.equal(libraryCalendars(data, "all", "FAMILIEN").length, 2);
  const copy = ownerCopy(received);
  assert.equal(copy.access, "owner");
  assert.equal(copy.receivedSourceId, undefined);
  assert.notEqual(copy.id, received.id);
  assert.equal(isCalendar(refreshed), true);
  assert.equal(isCalendar(copy), true);
});
test("quiz score counts only unlocked valid questions and invalidates edited questions", () => {
  const calendar = make();
  const question = structuredClone(questions[0]);
  calendar.doors[0].questions = [question];
  calendar.doors[4].questions = [question];
  const first = questionKey(1, 0, question),
    future = questionKey(5, 0, question);
  const progress = {
    [first]: { answer: question.answerIndex },
    [future]: { answer: question.answerIndex },
  };
  let score = quizSummary(calendar, progress, 4);
  assert.equal(score.total, 2);
  assert.equal(score.answered, 1);
  assert.equal(score.correct, 1);
  assert.equal(score.unlocked, 1);
  assert.equal(score.days[1].locked, true);
  assert.equal(quizSummary(calendar, progress, 5).correct, 2);
  calendar.doors[0].questions[0] = { ...question, title: "Et nytt spørsmål" };
  assert.equal(quizSummary(calendar, progress, 4).answered, 0);
  assert.deepEqual(
    parseQuizProgress(
      JSON.stringify({
        ...progress,
        bad: { answer: -1 },
        "1-2-a": { answer: 12 },
      }),
    ),
    progress,
  );
  assert.deepEqual(parseQuizProgress("malformed"), {});
  assert.deepEqual(parseQuizProgress("A".repeat(40001)), {});
});

test("multiple correct answers support more than four options and require the exact selected set", () => {
  const question: QuizQuestion = {
    type: "choice",
    title: "Velg partall",
    options: ["1", "2", "3", "4", "5", "6"],
    answerIndex: 1,
    correctAnswers: [1, 3, 5],
    explanation: "",
  };
  const calendar = make();
  calendar.doors[0].questions = [question];
  assert.equal(isCalendar(calendar), true);
  assert.equal(isQuestionComplete(question), true);
  assert.deepEqual(correctChoices(question), [1, 3, 5]);
  assert.equal(isQuizResponseCorrect(question, { answers: [5, 1, 3] }), true);
  assert.equal(isQuizResponseCorrect(question, { answers: [1, 3] }), false);
  assert.equal(
    isQuizResponseCorrect(question, { answers: [1, 3, 5, 0] }),
    false,
  );
  assert.equal(
    isQuizResponseCorrect(question, { answers: [1, 1, 3, 5] }),
    false,
  );
  question.correctAnswers = [1, 99];
  assert.equal(isCalendar(calendar), false);
  question.correctAnswers = [];
  assert.equal(isCalendar(calendar), true);
  assert.equal(isQuestionComplete(question), false);
});
test("written answers accept configured variants with normalized whitespace and case", () => {
  const question: QuizQuestion = {
    type: "text",
    title: "Hvem kommer med gavene?",
    options: [],
    answerIndex: 0,
    acceptedAnswers: ["Julenissen", "Nissen"],
    explanation: "God jul!",
  };
  const calendar = make();
  calendar.doors[1].questions = [question];
  assert.equal(isCalendar(calendar), true);
  assert.equal(isQuestionComplete(question), true);
  for (const text of ["  JULENISSEN ", "nissen", "Ｎｉｓｓｅｎ"])
    assert.equal(isQuizResponseCorrect(question, { text }), true);
  assert.equal(isQuizResponseCorrect(question, { text: "Reinsdyret" }), false);
  assert.equal(isQuizResponseCorrect(question, { text: "" }), false);
  assert.equal(isQuizResponseCorrect(question, { answers: [0] }), false);
  assert.equal(normalizeAnswer("  God  JUL\n"), "god jul");
  assert.deepEqual(
    decodeCalendar(encodeCalendar(calendar)).doors[1].questions,
    [question],
  );
  question.acceptedAnswers = [""];
  assert.equal(isQuestionComplete(question), false);
  assert.equal(isCalendar(calendar), true);
});
test("mixed quiz attempts survive reload, exclude locked days and reset when accepted answers change", () => {
  const calendar = make();
  const choice: QuizQuestion = {
    type: "choice",
    title: "To riktige",
    options: ["A", "B", "C", "D", "E"],
    answerIndex: 0,
    correctAnswers: [0, 4],
    explanation: "",
  };
  const written: QuizQuestion = {
    type: "text",
    title: "Et ord",
    options: [],
    answerIndex: 0,
    acceptedAnswers: ["desember"],
    explanation: "",
  };
  calendar.doors[0].questions = [choice];
  calendar.doors[1].questions = [written];
  const progress = {
    [questionKey(1, 0, choice)]: { answers: [4, 0] },
    [questionKey(2, 0, written)]: { text: "DESEMBER" },
  };
  const loaded = parseQuizProgress(JSON.stringify(progress));
  assert.deepEqual(loaded, progress);
  assert.equal(quizSummary(calendar, loaded, 1).correct, 1);
  assert.equal(quizSummary(calendar, loaded, 2).correct, 2);
  written.acceptedAnswers = ["januar"];
  assert.equal(quizSummary(calendar, loaded, 2).answered, 1);
  assert.deepEqual(
    parseQuizProgress(
      JSON.stringify({
        "1-0-a": { answers: [0, 0] },
        "1-1-a": { text: "", answer: 0 },
        "1-2-a": { answers: [12] },
      }),
    ),
    {},
  );
});
test("unchanged legacy quiz attempts retain their question key", () => {
  const question = structuredClone(questions[0]);
  const key = questionKey(1, 0, question);
  assert.equal(
    questionKey(1, 0, {
      ...question,
      type: "choice",
      correctAnswers: [question.answerIndex],
    }),
    key,
  );
  assert.notEqual(
    questionKey(1, 0, { ...question, correctAnswers: [0, 1] }),
    key,
  );
});
test("content order is preserved through sharing and removing a block clears its data only", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.kind = "message";
  door.title = "Litt av hvert";
  door.body = "En hilsen";
  door.contentOrder = ["quiz", "giftcard", "image", "link"];
  door.questions = structuredClone(questions.slice(0, 1));
  door.giftCard = {
    merchant: "Test",
    amount: 100,
    currency: "NOK",
    code: "TEST",
    url: "",
    expiresOn: "",
  };
  door.image = "data:image/jpeg;base64,AAAA";
  door.link = { label: "Se mer", url: "https://example.com" };
  assert.equal(isDoorComplete(door), true);
  const moved = moveDoorBlock(doorBlockOrder(door), 2, 0);
  assert.deepEqual(moved, ["image", "quiz", "giftcard", "link"]);
  assert.deepEqual(door.contentOrder, ["quiz", "giftcard", "image", "link"]);
  door.contentOrder = moved;
  assert.deepEqual(
    decodeCalendar(encodeCalendar(calendar)).doors[0].contentOrder,
    moved,
  );
  const removed = removeDoorBlock(door, "quiz");
  assert.equal(removed.questions, undefined);
  assert.equal(removed.giftCard?.code, "TEST");
  assert.deepEqual(doorBlockOrder(removed), ["image", "giftcard", "link"]);
  assert.equal(door.questions?.length, 1);
  const readded = {
    ...removed,
    questions: structuredClone(questions.slice(0, 1)),
    contentOrder: [...doorBlockOrder(removed), "quiz" as DoorBlockKind],
  };
  assert.equal(doorBlockOrder(readded).at(-1), "quiz");
});
test("empty content blocks remain editable drafts without becoming complete", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.kind = "message";
  door.title = "Utkast";
  door.body = "En ferdig hilsen";
  door.contentOrder = ["image", "link", "quiz"];
  door.image = "";
  door.link = { label: "", url: "" };
  door.questions = [];
  assert.equal(isCalendar(calendar), true);
  assert.equal(isDoorComplete(door), false);
  door.contentOrder = ["image", "image"];
  assert.equal(isCalendar(calendar), false);
  door.contentOrder = ["image"];
  door.link.url = "javascript:alert(1)";
  assert.equal(isCalendar(calendar), false);
});
test("all six scene motifs and animation flags remain compatible with older calendars", () => {
  const calendar = make();
  for (const house of [
    "classic",
    "cabin",
    "townhouse",
    "park",
    "forest",
    "village",
  ] as const) {
    calendar.scene = {
      ...DEFAULT_SCENE,
      house,
      wind: true,
      twinkle: true,
      snowfall: true,
    };
    assert.equal(isCalendar(calendar), true);
    assert.deepEqual(
      parseBackup(JSON.stringify({ ...initialData(), calendars: [calendar] }))
        .calendars[0].scene,
      calendar.scene,
    );
  }
  delete calendar.scene!.wind;
  delete calendar.scene!.twinkle;
  assert.equal(isCalendar(calendar), true);
});

test("doors need content rather than a custom heading to be ready", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.contentOrder = [];
  assert.equal(isDoorComplete(door), false);
  door.title = "En gammel overskrift";
  assert.equal(isDoorComplete(door), false);
  door.title = "";
  door.body = "God desember!";
  assert.equal(isDoorComplete(door), true);
  door.body = "";
  door.contentOrder = ["quiz"];
  door.questions = structuredClone(questions.slice(0, 1));
  assert.equal(isDoorComplete(door), true);
  assert.equal(completedCount(calendar), 1);
  assert.equal(isCalendar(calendar), true);
  assert.deepEqual(decodeCalendar(encodeCalendar(calendar)).doors[0], door);
  door.questions[0].title = "";
  assert.equal(isDoorComplete(door), false);
});

test("an opening effect is preserved without making an empty door ready", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.contentOrder = [];
  door.effect = "confetti";
  assert.equal(isDoorComplete(door), false);
  door.body = "En hilsen";
  assert.equal(isDoorComplete(door), true);
  assert.equal(
    decodeCalendar(encodeCalendar(calendar)).doors[0].effect,
    "confetti",
  );
  assert.deepEqual(calendarContentSummary(calendar), {
    counts: { message: 1 },
    questionCount: 0,
  });
  door.contentOrder = ["effect"];
  assert.equal(isDoorComplete(door), true);
});

test("the calendar summary includes every attached content type and counts quiz questions separately", () => {
  const calendar = make();
  const door = calendar.doors[0];
  door.body = "En hilsen";
  door.contentOrder = [
    "giftcard",
    "image",
    "video",
    "link",
    "quiz",
    "activity",
  ];
  door.questions = structuredClone(questions.slice(0, 2));
  calendar.doors[1].questions = structuredClone(questions.slice(0, 1));
  calendar.doors[1].effect = "snow";
  const result = calendarContentSummary(calendar);
  assert.deepEqual(result, {
    counts: {
      message: 1,
      giftcard: 1,
      image: 1,
      video: 1,
      link: 1,
      quiz: 2,
      activity: 1,
    },
    questionCount: 3,
  });
  const withoutImage = {
    ...calendar,
    doors: calendar.doors.map((item, index) =>
      index === 0 ? removeDoorBlock(item, "image") : item,
    ),
  };
  assert.equal(calendarContentSummary(withoutImage).counts.image, undefined);
  assert.equal(calendarContentSummary(withoutImage).counts.quiz, 2);
});
