import {
  Body,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Exercise, Goal } from "@/generated/prisma/client";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { nextExercisePosition } from "@/shared/domain/exercise-order";
import { optionalText } from "@/shared/utils/optional-text";
import {
  ExerciseInputDto,
  ExerciseOrderDto,
  GoalInputDto,
} from "./dto/library-input.dto";

@ApiTags("disciplines")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("goals")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class GoalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(":id")
  @ApiOperation({ summary: "Update a goal's name and criterion" })
  @ApiBadRequestResponse({ description: "Invalid goal data" })
  @ApiNotFoundResponse({ description: "Goal not found" })
  async updateGoal(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: GoalInputDto,
  ): Promise<Goal> {
    const [goal] = await this.prisma.goal.updateManyAndReturn({
      where: { id, discipline: { userId: user.id } },
      data: {
        name: body.name.trim(),
        criterion: optionalText(body.criterion),
      },
    });

    if (!goal) throw new NotFoundException("Goal not found");

    return goal;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a goal with its exercises and dog picks" })
  @ApiNoContentResponse({ description: "Goal deleted" })
  @ApiNotFoundResponse({ description: "Goal not found" })
  async deleteGoal(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<void> {
    const { count } = await this.prisma.goal.deleteMany({
      where: { id, discipline: { userId: user.id } },
    });

    if (count === 0) throw new NotFoundException("Goal not found");
  }

  @Post(":id/exercises")
  @ApiOperation({ summary: "Add an exercise to a goal" })
  @ApiBadRequestResponse({ description: "Invalid exercise data" })
  @ApiNotFoundResponse({ description: "Goal not found" })
  async createExercise(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: ExerciseInputDto,
  ): Promise<Exercise> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, discipline: { userId: user.id } },
      select: { id: true },
    });

    if (!goal) throw new NotFoundException("Goal not found");

    return this.prisma.exercise.create({
      data: {
        name: body.name.trim(),
        procedure: optionalText(body.procedure),
        goalId: goal.id,
        position: await nextExercisePosition(this.prisma, goal.id),
      },
    });
  }

  @Put(":id/exercise-order")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Reorder a goal's exercises",
    description:
      "The order is purely visual: statuses, results and scheduled trainings stay as they are.",
  })
  @ApiNoContentResponse({ description: "Order saved" })
  @ApiBadRequestResponse({ description: "Invalid exercise order" })
  @ApiNotFoundResponse({ description: "Goal not found" })
  @ApiConflictResponse({
    description: "The list doesn't match the goal's current exercises",
  })
  async reorderExercises(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: ExerciseOrderDto,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({
        where: { id, discipline: { userId: user.id } },
        select: { exercises: { select: { id: true } } },
      });

      if (!goal) throw new NotFoundException("Goal not found");

      // A stale list (an exercise added or deleted elsewhere) would leave
      // some exercises without a place, so the client has to reload first.
      const current = new Set(goal.exercises.map((exercise) => exercise.id));
      const matches =
        body.exerciseIds.length === current.size &&
        body.exerciseIds.every((exerciseId) => current.has(exerciseId));
      if (!matches) {
        throw new ConflictException(
          "exerciseIds must list every exercise of the goal",
        );
      }

      for (const [position, exerciseId] of body.exerciseIds.entries()) {
        await tx.exercise.updateMany({
          where: { id: exerciseId, goalId: id },
          data: { position },
        });
      }
    });
  }
}
