import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
import { AuthModule } from "@/shared/auth/auth.module";
import { OnboardingController } from "./controllers/onboarding.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OnboardingController],
  providers: [DogSelectionService],
})
export class OnboardingModule {}
