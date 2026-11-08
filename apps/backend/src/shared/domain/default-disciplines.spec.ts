import { describe, expect, it, vi } from "vitest";
import {
  createDefaultDisciplines,
  DEFAULT_DISCIPLINES,
  signUpLanguage,
} from "./default-disciplines";

describe("default disciplines", () => {
  it("creates every discipline with its goals and ordered exercises", async () => {
    const create = vi.fn();

    await createDefaultDisciplines(
      { discipline: { create } } as never,
      "user-a",
      "en",
    );

    expect(create).toHaveBeenCalledTimes(DEFAULT_DISCIPLINES.length);
    expect(create.mock.calls[0]![0]).toEqual({
      data: {
        userId: "user-a",
        name: "Obedience basics",
        goals: {
          create: [
            {
              name: "Loose-leash walking",
              exercises: {
                create: [
                  { name: "Attention on name", position: 0 },
                  { name: "Heel for 10 steps without pulling", position: 1 },
                  { name: "Changes of direction", position: 2 },
                ],
              },
            },
            expect.anything(),
            expect.anything(),
          ],
        },
      },
    });
  });

  it("uses Czech names for a Czech account", async () => {
    const create = vi.fn();

    await createDefaultDisciplines(
      { discipline: { create } } as never,
      "user-a",
      "cs",
    );

    expect(create.mock.calls.map(([args]) => args.data.name)).toEqual([
      "Základy poslušnosti",
      "Spolehlivé přivolání",
      "Nosework – začátky",
      "Agility – základy",
      "Canicross – začátky",
    ]);
  });

  it.each([
    ["http://localhost:3050/overview?lng=en", "en"],
    ["/overview?lng=en", "en"],
    ["http://localhost:3050/overview", "cs"],
    [undefined, "cs"],
    [42, "cs"],
  ])(
    "takes the sign-up language from the callback %s",
    (callback, language) => {
      expect(signUpLanguage(callback)).toBe(language);
    },
  );
});
