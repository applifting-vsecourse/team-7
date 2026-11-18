import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { EmailChangeConfirmationController } from "./controllers/email-change-confirmation.controller";
import { EmailChangeController } from "./controllers/email-change.controller";
import { SubscriptionController } from "./controllers/subscription.controller";
import { UserSettingsController } from "./controllers/user-settings.controller";
import { SubscriptionService } from "./services/subscription.service";
import { UserSettingsService } from "./services/user-settings.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    SubscriptionController,
    UserSettingsController,
    EmailChangeController,
    EmailChangeConfirmationController,
  ],
  providers: [UserSettingsService, SubscriptionService],
})
export class UsersModule {}
