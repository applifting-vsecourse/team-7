import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { OnboardingController } from "./controllers/onboarding.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
