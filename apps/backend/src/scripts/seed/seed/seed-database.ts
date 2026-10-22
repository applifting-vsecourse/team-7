import { PrismaService } from "@/core/prisma/prisma.service";
import { BetterAuth } from "@/shared/auth/providers/better-auth.provider";
import { Config } from "@/shared/config/config.service";
import { createUser } from "./create-user";
import { seedDisciplines } from "./seed-disciplines";
import { seedDogs } from "./seed-dogs";

export const seedDatabase = async (
  prisma: PrismaService,
  config: Config,
  betterAuth: BetterAuth,
): Promise<void> => {
  const auth = betterAuth;

  // `pnpm dev` runs the seed on every start, so never clobber a database that
  // already has data — that would delete the account and data you just made.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `Database already has ${existingUsers} user(s) — skipping user seed. ` +
        "Run `pnpm backend db:reset` to wipe and start over.",
    );
    await seedDogs(prisma);
    await seedDisciplines(prisma);
    return;
  }

  // Drop existing database data from all tables
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "dog", "session", "account", "verification", "user" RESTART IDENTITY CASCADE;',
    );
  } catch (error) {
    console.error("Error truncating tables:", error);
  }

  console.log("Creating superadmin user");

  // Create a superadmin user. This should be delete in prod app
  await createUser(prisma, auth, {
    email: config.superadminEmail,
    password: config.superadminPassword,
    name: "Admin (Delete in Prod)",
    role: "admin",
  });

  console.log("Creating example users");

  await createUser(prisma, auth, {
    email: "caffeinatedduck@example.com",
    password: "password1",
    name: "Caffeinated Duck",
  });

  await createUser(prisma, auth, {
    email: "deepduckthoughts@example.com",
    password: "password2",
    name: "Deep Duck Thoughts",
  });

  await createUser(prisma, auth, {
    email: "breadcritic@example.com",
    password: "password3",
    name: "The Bread Critic",
  });

  await createUser(prisma, auth, {
    email: "migrationseason@example.com",
    password: "password4",
    name: "Migration Season",
  });

  await createUser(prisma, auth, {
    email: "pondadmin@example.com",
    password: "password5",
    name: "Pond Admin",
  });

  await seedDogs(prisma);
  await seedDisciplines(prisma);
};
