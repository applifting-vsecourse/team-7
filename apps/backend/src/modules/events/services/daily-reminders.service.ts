import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { DailyReminder } from "@/core/email/templates/daily-reminder";
import { PrismaService } from "@/core/prisma/prisma.service";
import { dayMs, localCalendar } from "@/modules/events/domain/local-calendar";
import { Config } from "@/shared/config/config.service";

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
        dog: { archivedAt: null, user: { emailVerified: true } },
        // Pad UTC midnight to cover the whole local day, including DST changes.
        // Filter exact local dates below, as in the overview.
        startsAt: {
          gte: new Date(Date.parse(calendar.today) - dayMs),
          lt: new Date(Date.parse(calendar.tomorrow) + dayMs),
        },
      },
      select: {
        startsAt: true,
        dog: { select: { user: { select: { id: true, email: true } } } },
      },
    });
    const recipients = new Map<string, string>();
    for (const exercise of exercises) {
      if (calendar.dayOf(exercise.startsAt) === calendar.today) {
        recipients.set(exercise.dog.user.id, exercise.dog.user.email);
      }
    }
    if (recipients.size === 0) return;

    // Accounts do not yet persist a language preference; use the Czech default.
    const language = "cs";
    const url = new URL("/overview", this.config.frontendUrl);
    url.searchParams.set("lng", language);
    const html = await renderEmail(DailyReminder, {
      url: url.toString(),
      language,
    });
    for (const [userId, to] of recipients) {
      try {
        await this.email.sendEmail(
          to,
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
