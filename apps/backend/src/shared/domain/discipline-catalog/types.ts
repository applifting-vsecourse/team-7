export const CATALOG_LANGUAGES = ["cs", "en"] as const;
export type CatalogLanguage = (typeof CATALOG_LANGUAGES)[number];

export type CatalogText = Record<CatalogLanguage, string>;

export type CatalogExercise = { name: CatalogText; procedure: CatalogText };
export type CatalogGoal = {
  name: CatalogText;
  // When the goal counts as achieved.
  criterion: CatalogText;
  exercises: CatalogExercise[];
};
export type CatalogDiscipline = {
  key: string;
  // Tab label on the landing page.
  shortName: CatalogText;
  name: CatalogText;
  description: CatalogText;
  goals: CatalogGoal[];
};
export type CatalogCategory = {
  key: string;
  name: CatalogText;
  description: CatalogText;
  disciplines: CatalogDiscipline[];
};
