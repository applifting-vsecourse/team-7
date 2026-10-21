import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { DisciplinesController } from "./controllers/disciplines.controller";
import { ExercisesController } from "./controllers/exercises.controller";
import { GoalsController } from "./controllers/goals.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DisciplinesController, GoalsController, ExercisesController],
})
export class DisciplinesModule {}
