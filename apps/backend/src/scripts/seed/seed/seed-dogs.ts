import { PrismaService } from "@/core/prisma/prisma.service";

export async function seedDogs(prisma: PrismaService): Promise<void> {
  const usersWithoutDogs = await prisma.user.findMany({
    where: { dogs: { none: {} } },
    select: { id: true, name: true },
  });

  if (usersWithoutDogs.length === 0) {
    return;
  }

  await prisma.dog.createMany({
    data: usersWithoutDogs.map((user) => ({
      userId: user.id,
      name: `${user.name}'s dog`,
    })),
  });

  console.log(`Created dogs for ${usersWithoutDogs.length} user(s).`);
}
