import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { EmailChangeConfirmationController } from "./controllers/email-change-confirmation.controller";
import { EmailChangeController } from "./controllers/email-change.controller";
import { UserSettingsController } from "./controllers/user-settings.controller";
import { UserSettingsService } from "./services/user-settings.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    UserSettingsController,
    EmailChangeController,
    EmailChangeConfirmationController,
  ],
  providers: [UserSettingsService],
})
export class UsersModule {}
