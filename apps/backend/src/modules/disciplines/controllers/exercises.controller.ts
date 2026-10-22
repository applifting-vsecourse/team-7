import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
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
import type { Exercise } from "@/generated/prisma/client";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { optionalText } from "@/shared/utils/optional-text";
import { ExerciseInputDto } from "./dto/library-input.dto";

@ApiTags("disciplines")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("exercises")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ExercisesController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(":id")
  @ApiOperation({ summary: "Update an exercise's name and procedure" })
  @ApiBadRequestResponse({ description: "Invalid exercise data" })
  @ApiNotFoundResponse({ description: "Exercise not found" })
  async updateExercise(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: ExerciseInputDto,
  ): Promise<Exercise> {
    const [exercise] = await this.prisma.exercise.updateManyAndReturn({
      where: { id, goal: { discipline: { userId: user.id } } },
      data: {
        name: body.name.trim(),
        procedure: optionalText(body.procedure),
      },
    });

    if (!exercise) throw new NotFoundException("Exercise not found");

    return exercise;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an exercise and its dog picks" })
  @ApiNoContentResponse({ description: "Exercise deleted" })
  @ApiNotFoundResponse({ description: "Exercise not found" })
  async deleteExercise(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<void> {
    const { count } = await this.prisma.exercise.deleteMany({
      where: { id, goal: { discipline: { userId: user.id } } },
    });

    if (count === 0) throw new NotFoundException("Exercise not found");
  }
}
