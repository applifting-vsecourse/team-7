import { describe, expect, it } from "vitest";
import {
  NAME_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from "@/modules/disciplines/controllers/dto/library-input.dto";
import {
  CATALOG_LANGUAGES,
  CATEGORY_KEYS,
  DISCIPLINE_CATALOG,
  findCatalogDiscipline,
  localizeCatalog,
  type CatalogText,
} from "@/shared/domain/discipline-catalog";

const disciplines = DISCIPLINE_CATALOG.flatMap(
  (category) => category.disciplines,
);

function expectText(text: CatalogText, max: number) {
  for (const lng of CATALOG_LANGUAGES) {
    expect(text[lng].trim()).not.toBe("");
    expect(text[lng].length).toBeLessThanOrEqual(max);
  }
}

describe("discipline catalog", () => {
  it("has the five categories in order", () => {
    expect(CATEGORY_KEYS).toEqual([
      "everyday",
      "obedience-sports",
      "scent",
      "agility-sports",
      "mushing",
    ]);
  });

  it("has unique discipline keys, including the former defaults", () => {
    const keys = disciplines.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        "obedience",
        "recall",
        "nosework",
        "agility",
        "canicross",
      ]),
    );
  });

  it("has 3 goals with 2–4 exercises in every discipline", () => {
    for (const discipline of disciplines) {
      expect(discipline.goals, discipline.key).toHaveLength(3);
      for (const goal of discipline.goals) {
        expect(goal.exercises.length).toBeGreaterThanOrEqual(2);
        expect(goal.exercises.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("has every text in Czech and English within the library limits", () => {
    for (const category of DISCIPLINE_CATALOG) {
      expectText(category.name, NAME_MAX_LENGTH);
      expectText(category.description, TEXT_MAX_LENGTH);
    }
    for (const discipline of disciplines) {
      expectText(discipline.shortName, NAME_MAX_LENGTH);
      expectText(discipline.name, NAME_MAX_LENGTH);
      expectText(discipline.description, TEXT_MAX_LENGTH);
      for (const goal of discipline.goals) {
        expectText(goal.name, NAME_MAX_LENGTH);
        expectText(goal.criterion, TEXT_MAX_LENGTH);
        for (const exercise of goal.exercises) {
          expectText(exercise.name, NAME_MAX_LENGTH);
          expectText(exercise.procedure, TEXT_MAX_LENGTH);
        }
      }
    }
  });

  it("finds a discipline with its category", () => {
    expect(findCatalogDiscipline("nosework")).toMatchObject({
      category: { key: "scent" },
      discipline: { key: "nosework" },
    });
    expect(findCatalogDiscipline("unknown")).toBeUndefined();
  });

  it("localizes without criteria and procedures", () => {
    const { categories } = localizeCatalog("en");
    const goal = categories[0]!.disciplines[0]!.goals[0]!;

    expect(categories[0]).toMatchObject({
      key: "everyday",
      name: "Everyday life & manners",
    });
    expect(Object.keys(goal)).toEqual(["name", "exercises"]);
    expect(Object.keys(goal.exercises[0]!)).toEqual(["name"]);
  });
});
