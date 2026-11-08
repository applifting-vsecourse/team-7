import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { UserSettingsController } from "./controllers/user-settings.controller";
import { UserSettingsService } from "./services/user-settings.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
})
export class UsersModule {}
