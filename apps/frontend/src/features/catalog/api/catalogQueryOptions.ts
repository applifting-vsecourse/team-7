import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

// Public catalog of ready-made disciplines (#14): the landing page shows it
// without a session, the app copies picked disciplines into the library.
const catalogDisciplineSchema = z.object({
  key: z.string(),
  shortName: z.string(),
  name: z.string(),
  description: z.string(),
  goals: z.array(
    z.object({
      name: z.string(),
      exercises: z.array(z.object({ name: z.string() })),
    }),
  ),
});
const catalogCategorySchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  disciplines: z.array(catalogDisciplineSchema),
});
const catalogSchema = z.object({ categories: z.array(catalogCategorySchema) });

export type CatalogDiscipline = z.infer<typeof catalogDisciplineSchema>;
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;
export type CatalogLanguage = "cs" | "en";

export const catalogLanguage = (lng: string): CatalogLanguage =>
  lng.startsWith("en") ? "en" : "cs";

export const catalogQueryOptions = (lng: CatalogLanguage) =>
  queryOptions({
    queryKey: ["catalog", lng],
    queryFn: async ({ signal }) =>
      catalogSchema.parse(
        await api.get("catalog", { searchParams: { lng }, signal }).json(),
      ).categories,
    staleTime: Infinity,
  });
