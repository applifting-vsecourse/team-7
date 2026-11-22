import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { EmailLayout } from "@/core/email/components/email-layout";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Config } from "@/shared/config/config.service";

@Injectable()
export class TrialRemindersService {
  private readonly logger = new Logger(TrialRemindersService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject("EmailService") private readonly email: EmailService,
    private readonly config: Config,
  ) {}
  @Cron("0 0 * * * *", {
    name: "plus-trial-reminders",
    timeZone: "Europe/Prague",
    waitForCompletion: true,
  })
  async sendTrialReminders() {
    const now = new Date();
    const trials = await this.prisma.subscription.findMany({
      where: {
        trialEndsAt: { gt: now, lte: new Date(now.getTime() + 86400_000) },
        trialReminderSentAt: null,
        OR: [{ paidUntil: null }, { paidUntil: { lte: now } }],
        // Transactional (billing), so emailNotificationsEnabled is ignored on
        // purpose: that setting only covers training reminders.
        user: { emailVerified: true },
      },
      include: { user: { select: { email: true } } },
    });
    for (const trial of trials) {
      const claim = await this.prisma.subscription.updateMany({
        where: { userId: trial.userId, trialReminderSentAt: null },
        data: { trialReminderSentAt: now },
      });
      if (!claim.count) continue;
      try {
        const content = emailMessages.cs.trialEnding;
        const url = new URL(
          "/settings?lng=cs",
          this.config.frontendUrl,
        ).toString();
        const html = await renderEmail(EmailLayout, {
          language: "cs",
          preview: content.subject,
          label: content.subject,
          heading: content.subject,
          description: content.description,
          button: content.button,
          footer: content.disclaimer,
          url,
        });
        await this.email.sendEmail(trial.user.email, content.subject, html);
      } catch (error) {
        await this.prisma.subscription.updateMany({
          where: { userId: trial.userId, trialReminderSentAt: now },
          data: { trialReminderSentAt: null },
        });
        this.logger.error("Failed to send Plus trial reminder", error);
      }
    }
  }
}
