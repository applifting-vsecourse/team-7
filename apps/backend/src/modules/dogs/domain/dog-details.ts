import type { Dog } from "@/generated/prisma/client";

export type DogDetails = Omit<Dog, "avatar">;
