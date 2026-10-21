import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Exercise, Goal } from "@/generated/prisma/client";
import { optionalText } from "@/modules/disciplines/domain/discipline-details";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { ExerciseInputDto, GoalInputDto } from "./dto/library-input.dto";

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
      },
    });
  }
}
