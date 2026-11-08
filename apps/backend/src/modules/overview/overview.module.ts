import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { OverviewController } from "./controllers/overview.controller";
import { NeglectedDisciplinesService } from "./services/neglected-disciplines.service";
import { OverviewService } from "./services/overview.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OverviewController],
  providers: [OverviewService, NeglectedDisciplinesService],
})
export class OverviewModule {}
