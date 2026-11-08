import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import {
  DailyReminder,
  type DailyReminderDog,
} from "@/core/email/templates/daily-reminder";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Config } from "@/shared/config/config.service";
import { dayMs, localCalendar } from "@/shared/domain/local-calendar";

const timeZone = "Europe/Prague";

@Injectable()
export class DailyRemindersService {
  private readonly logger = new Logger(DailyRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject("EmailService") private readonly email: EmailService,
    private readonly config: Config,
  ) {}

  @Cron("0 0 7 * * *", {
    name: "daily-exercise-reminders",
    timeZone,
    waitForCompletion: true,
  })
  async sendDailyReminders(): Promise<void> {
    const calendar = localCalendar(new Date(), timeZone);
    const exercises = await this.prisma.scheduledExercise.findMany({
      where: {
        kind: "exercise",
        completedAt: null,
        deletedAt: null,
        dog: {
          archivedAt: null,
          user: { emailVerified: true, emailNotificationsEnabled: true },
        },
        // Pad UTC midnight to cover the whole local day, including DST changes.
        // Filter exact local dates below, as in the overview.
        startsAt: {
          gte: new Date(Date.parse(calendar.today) - dayMs),
          lt: new Date(Date.parse(calendar.tomorrow) + dayMs),
        },
      },
      select: {
        id: true,
        startsAt: true,
        exercise: { select: { name: true } },
        dog: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    });
    const recipients = new Map<
      string,
      { email: string; dogs: Map<string, DailyReminderDog> }
    >();
    for (const exercise of exercises) {
      if (
        calendar.dayOf(exercise.startsAt) !== calendar.today ||
        !exercise.exercise
      )
        continue;
      const { dog } = exercise;
      let recipient = recipients.get(dog.user.id);
      if (!recipient) {
        recipient = { email: dog.user.email, dogs: new Map() };
        recipients.set(dog.user.id, recipient);
      }
      let reminderDog = recipient.dogs.get(dog.id);
      if (!reminderDog) {
        reminderDog = { id: dog.id, name: dog.name, exercises: [] };
        recipient.dogs.set(dog.id, reminderDog);
      }
      reminderDog.exercises.push({
        id: exercise.id,
        name: exercise.exercise.name,
      });
    }
    if (recipients.size === 0) return;

    // Accounts do not yet persist a language preference; use the Czech default.
    const language = "cs";
    const url = new URL("/overview", this.config.frontendUrl);
    url.searchParams.set("lng", language);
    for (const [userId, recipient] of recipients) {
      try {
        const html = await renderEmail(DailyReminder, {
          url: url.toString(),
          language,
          dogs: [...recipient.dogs.values()],
        });
        await this.email.sendEmail(
          recipient.email,
          emailMessages[language].dailyReminder.subject,
          html,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send daily exercise reminder to user ${userId}`,
          error,
        );
      }
    }
  }
}
