import { PrismaService } from "@/core/prisma/prisma.service";
import { BetterAuth } from "@/shared/auth/providers/better-auth.provider";
import { Config } from "@/shared/config/config.service";
import { createUser } from "./create-user";

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
      `Database already has ${existingUsers} user(s) — skipping seed. ` +
        "Run `pnpm backend db:reset` to wipe and start over.",
    );
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
    username: "superadmin",
    role: "admin",
  });

  console.log("Creating example users");

  await createUser(prisma, auth, {
    email: "caffeinatedduck@example.com",
    password: "password1",
    name: "Caffeinated Duck",
    username: "CaffeinatedDuck",
  });

  await createUser(prisma, auth, {
    email: "deepduckthoughts@example.com",
    password: "password2",
    name: "Deep Duck Thoughts",
    username: "DeepDuckThoughts",
  });

  await createUser(prisma, auth, {
    email: "breadcritic@example.com",
    password: "password3",
    name: "The Bread Critic",
    username: "BreadCritic",
  });

  await createUser(prisma, auth, {
    email: "migrationseason@example.com",
    password: "password4",
    name: "Migration Season",
    username: "MigrationSeason",
  });

  await createUser(prisma, auth, {
    email: "pondadmin@example.com",
    password: "password5",
    name: "Pond Admin",
    username: "PondAdmin",
  });
};
