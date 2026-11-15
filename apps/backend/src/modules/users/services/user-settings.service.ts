import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { UserSettings } from "@/modules/users/domain/user-settings";

const select = { emailNotificationsEnabled: true } as const;

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const [dogs, disciplines, exercises, videos] =
      await this.prisma.$transaction([
        this.prisma.dog.count({ where: { userId } }),
        this.prisma.discipline.count({ where: { userId } }),
        this.prisma.scheduledExercise.count({
          where: { dog: { userId }, deletedAt: null },
        }),
        this.prisma.video.count({
          where: { userId, status: { not: "deleting" } },
        }),
      ]);
    return { dogs, disciplines, exercises, videos };
  }

  async get(userId: string): Promise<UserSettings> {
    const settings = await this.prisma.user.findUnique({
      where: { id: userId },
      select,
    });
    if (!settings) throw new NotFoundException("User not found");
    return settings;
  }

  async update(userId: string, settings: UserSettings): Promise<UserSettings> {
    const [updated] = await this.prisma.user.updateManyAndReturn({
      where: { id: userId },
      data: { emailNotificationsEnabled: settings.emailNotificationsEnabled },
      select,
    });
    if (!updated) throw new NotFoundException("User not found");
    return updated;
  }
}
