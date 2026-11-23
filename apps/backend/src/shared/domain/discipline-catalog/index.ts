import type {
  CatalogCategory,
  CatalogDiscipline,
  CatalogLanguage,
} from "./types";
import { agilitySports } from "./agility-sports";
import { everyday } from "./everyday";
import { mushing } from "./mushing";
import { obedienceSports } from "./obedience-sports";
import { scent } from "./scent";

export * from "./types";

// Ready-made disciplines a handler copies into their library (F-63).
export const DISCIPLINE_CATALOG: CatalogCategory[] = [
  everyday,
  obedienceSports,
  scent,
  agilitySports,
  mushing,
];

export const CATEGORY_KEYS = DISCIPLINE_CATALOG.map(({ key }) => key);

export function findCatalogDiscipline(
  key: string,
): { category: CatalogCategory; discipline: CatalogDiscipline } | undefined {
  for (const category of DISCIPLINE_CATALOG) {
    const discipline = category.disciplines.find((item) => item.key === key);
    if (discipline) return { category, discipline };
  }
}

/** The public catalog in one language, without criteria and procedures. */
export function localizeCatalog(lng: CatalogLanguage) {
  return {
    categories: DISCIPLINE_CATALOG.map((category) => ({
      key: category.key,
      name: category.name[lng],
      description: category.description[lng],
      disciplines: category.disciplines.map((discipline) => ({
        key: discipline.key,
        shortName: discipline.shortName[lng],
        name: discipline.name[lng],
        description: discipline.description[lng],
        goals: discipline.goals.map((goal) => ({
          name: goal.name[lng],
          exercises: goal.exercises.map((exercise) => ({
            name: exercise.name[lng],
          })),
        })),
      })),
    })),
  };
}

export type LocalizedCatalog = ReturnType<typeof localizeCatalog>;
