import { type APIRequestContext, request } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { credentials, expect, test } from "./fixtures";

// API-only: the backend runs on the same port locally and in CI.
const api = "http://localhost:4050/api/";
const other = {
  email: "deepduckthoughts@example.com",
  password: "password2",
};

async function signIn(user: { email: string; password: string }) {
  const context = await request.newContext({
    baseURL: api,
    extraHTTPHeaders: { Origin: "http://localhost:3050" },
  });
  const response = await context.post("auth/sign-in/email", { data: user });
  expect(response.ok(), `Sign-in failed for ${user.email}`).toBeTruthy();
  return context;
}

async function create(context: APIRequestContext, path: string, data: object) {
  const response = await context.post(path, { data });
  expect(response.ok(), `POST ${path} (${response.status()})`).toBeTruthy();
  return ((await response.json()) as { id: string }).id;
}

test("another user can neither see nor change my dogs, disciplines and trainings", async () => {
  const owner = await signIn(credentials);
  const intruder = await signIn(other);
  const timeZone = "Europe/Prague";
  const startsAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
  const suffix = randomUUID();

  const dog = await create(owner, "dogs", { name: `E2E dog ${suffix}` });
  const discipline = await create(owner, "disciplines", {
    name: `E2E discipline ${suffix}`,
  });
  try {
    const goal = await create(owner, `disciplines/${discipline}/goals`, {
      name: "E2E goal",
    });
    const exercise = await create(owner, `goals/${goal}/exercises`, {
      name: "E2E exercise",
    });
    const lesson = await create(owner, "events/lessons", {
      timeZone,
      dogId: dog,
      startsAt,
      durationMinutes: 60,
    });
    const assigned = `dogs/${dog}/disciplines/${discipline}`;
    const move = { startsAt, durationMinutes: 30, timeZone };

    await test.step("Every request with the owner's IDs is not found", async () => {
      const attempts: [string, string, object?][] = [
        ["GET", `dogs/${dog}`],
        ["PATCH", `dogs/${dog}`, { name: "Intruder" }],
        ["POST", `dogs/${dog}/archive`],
        ["GET", `dogs/${dog}/avatar`],
        ["GET", `dogs/${dog}/exercises/${exercise}`],
        ["GET", `events/dogs/${dog}/exercises`],
        ["GET", `disciplines/${discipline}`],
        ["PATCH", `disciplines/${discipline}`, { name: "Intruder" }],
        ["POST", `disciplines/${discipline}/goals`, { name: "Intruder" }],
        ["PATCH", `goals/${goal}`, { name: "Intruder" }],
        ["POST", `goals/${goal}/exercises`, { name: "Intruder" }],
        ["PATCH", `exercises/${exercise}`, { name: "Intruder" }],
        ["POST", assigned],
        ["GET", `${assigned}/selection`],
        [
          "POST",
          "events/lessons",
          { timeZone, dogId: dog, startsAt, durationMinutes: 60 },
        ],
        ["PATCH", `events/${lesson}/result`, {}],
        ["PATCH", `events/${lesson}/schedule`, move],
        ["GET", `dogs/${dog}/sessions/${lesson}/videos`],
        ["DELETE", `events/${lesson}`],
        ["DELETE", `exercises/${exercise}`],
        ["DELETE", `goals/${goal}`],
        ["DELETE", `disciplines/${discipline}`],
        ["DELETE", `dogs/${dog}`],
      ];
      for (const [method, path, data] of attempts) {
        const response = await intruder.fetch(path, { method, data });
        expect.soft(response.status(), `${method} ${path}`).toBe(404);
      }
    });

    await test.step("The other user's lists contain none of the owner's data", async () => {
      const from = new Date(Date.now() - 86_400_000).toISOString();
      const to = new Date(Date.now() + 7 * 86_400_000).toISOString();
      const lists = [
        "dogs",
        "dogs/archived",
        "disciplines",
        `events?from=${from}&to=${to}`,
        `overview?timeZone=${timeZone}`,
      ];
      for (const path of lists) {
        const body = await (await intruder.get(path)).text();
        for (const id of [dog, discipline, goal, exercise, lesson]) {
          expect.soft(body, `GET ${path} leaks ${id}`).not.toContain(id);
        }
      }
    });

    await test.step("The owner's data is unchanged", async () => {
      const saved = (await (await owner.get(`dogs/${dog}`)).json()) as {
        name: string;
        archivedAt: string | null;
      };
      expect(saved).toMatchObject({
        name: `E2E dog ${suffix}`,
        archivedAt: null,
      });
      const events = await owner.get(
        `events?from=${new Date().toISOString()}&to=${new Date(Date.now() + 7 * 86_400_000).toISOString()}`,
      );
      expect(await events.text()).toContain(lesson);
    });
  } finally {
    // Cascades remove the goal, exercise and lesson.
    for (const path of [`dogs/${dog}`, `disciplines/${discipline}`]) {
      expect((await owner.delete(path)).ok(), `Cleanup ${path}`).toBeTruthy();
    }
    await owner.dispose();
    await intruder.dispose();
  }
});
