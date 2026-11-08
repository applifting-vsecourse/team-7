import { Module } from "@nestjs/common";
import { MailModule } from "@/core/email/mail.module";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { DailyRemindersService } from "./services/daily-reminders.service";

/** Scheduled emails reminding handlers of their trainings; no HTTP endpoints. */
@Module({
  imports: [PrismaModule, MailModule],
  providers: [DailyRemindersService],
})
export class RemindersModule {}
