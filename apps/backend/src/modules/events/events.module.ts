import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { EventsController } from "./controllers/events.controller";
import { EventsService } from "./services/events.service";
import { OverviewService } from "./services/overview.service";
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsService, OverviewService],
})
export class EventsModule {}
