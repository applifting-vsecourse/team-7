import { Module } from "@nestjs/common";
import { MailModule } from "@/core/email/mail.module";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { EventsController } from "./controllers/events.controller";
import { DailyRemindersService } from "./services/daily-reminders.service";
import { EventsService } from "./services/events.service";
import { NeglectedDisciplinesService } from "./services/neglected-disciplines.service";
import { OverviewService } from "./services/overview.service";
@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    OverviewService,
    NeglectedDisciplinesService,
    DailyRemindersService,
  ],
})
export class EventsModule {}
