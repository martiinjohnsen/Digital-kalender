import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyDoor, type AppData } from "../src/lib/model.ts";
import { validateDoor } from "../src/lib/door-validation.ts";

test("an empty door needs content, while text remains optional when a complete block exists", () => {
  const door = { ...emptyDoor(1), contentOrder: [] };
  assert.ok(validateDoor(door).body);
  door.body = "God desember!";
  assert.deepEqual(validateDoor(door), {});
  const image = { ...emptyDoor(1), contentOrder: ["image"] as const, image: "data:image/png;base64,YWJj" };
  assert.deepEqual(validateDoor({ ...image, contentOrder: [...image.contentOrder] }), {});
});

test("selected but unfinished attachments produce errors at their own fields", () => {
  const door = { ...emptyDoor(1), contentOrder: ["image", "video", "link", "activity"] as const };
  assert.deepEqual(Object.keys(validateDoor({ ...door, contentOrder: [...door.contentOrder] })),
    ["image", "video", "link-url", "activity-title", "activity-body"]);
});

test("a gift needs a merchant, positive amount and either a code or a valid redemption link", () => {
  const door = {
    ...emptyDoor(1), contentOrder: ["giftcard"] as ("giftcard")[],
    giftCard: { merchant: "", amount: 0, currency: "NOK" as const, code: "", url: "", expiresOn: "" }
  };
  assert.deepEqual(Object.keys(validateDoor(door)), ["gift-merchant", "gift-amount", "gift-code"]);
  Object.assign(door.giftCard, { merchant: "Kaféen", amount: 100, code: "GAVE" });
  assert.deepEqual(validateDoor(door), {});
  Object.assign(door.giftCard, { code: "", url: "https://example.com/gavekort", expiresOn: "2027-12-31" });
  assert.deepEqual(validateDoor(door), {});
  door.giftCard.expiresOn = "2027-02-30";
  assert.ok(validateDoor(door)["gift-expiry"]);
});

test("quiz feedback identifies blank options and requires an explicit correct choice", () => {
  const door = {
    ...emptyDoor(1), contentOrder: ["quiz"] as ("quiz")[],
    questions: [{ title: "", options: ["Kakao", ""], answerIndex: 0, correctAnswers: [] as number[], explanation: "" }]
  };
  assert.deepEqual(Object.keys(validateDoor(door)), ["quiz-0-title", "quiz-0-option-1", "quiz-0-correct"]);
  Object.assign(door.questions[0], { title: "Hva vil du ha?", options: ["Kakao", "Te"], correctAnswers: [1] });
  assert.deepEqual(validateDoor(door), {});
});

test("written-answer questions and empty quiz groups report what is missing", () => {
  const door = { ...emptyDoor(1), contentOrder: ["quiz"] as ("quiz")[], questions: [] as import("../src/lib/model.ts").QuizQuestion[] };
  assert.ok(validateDoor(door).quiz);
  door.questions = [{ type: "text", title: "Hvem kommer på julaften?", options: [], answerIndex: 0, acceptedAnswers: [""], explanation: "" }];
  assert.ok(validateDoor(door)["quiz-0-answers"]);
  door.questions[0].acceptedAnswers = ["Julenissen", "Nissen"];
  assert.deepEqual(validateDoor(door), {});
});

test("existing complete doors remain valid and validation never changes their saved data", () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/existing-workspace-v1.json", import.meta.url), "utf8")) as { data: AppData };
  const before = JSON.stringify(fixture.data);
  for (const door of fixture.data.calendars[0].doors.slice(0, 2))
    assert.deepEqual(validateDoor(door), {});
  assert.equal(JSON.stringify(fixture.data), before);
});
