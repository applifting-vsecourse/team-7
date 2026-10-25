import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type {} from "multer";
import { PrismaService } from "@/core/prisma/prisma.service";
import { DisciplineInputDto } from "@/modules/disciplines/controllers/dto/library-input.dto";
import { AVATAR_UPLOAD_LIMIT } from "@/modules/dogs/avatars/avatars.constants";
import { DogAvatarsService } from "@/modules/dogs/avatars/avatars.service";
import type { DogDetails } from "@/modules/dogs/domain/dog-details";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { optionalText } from "@/shared/utils/optional-text";
import { DogInputDto } from "./dto/dog-input.dto";

const omitAvatar = { avatar: true } as const;

/** Absent optional fields stay unchanged on update; blank ones are cleared. */
function dogFields({ name, breed, birthDate }: DogInputDto) {
  return {
    name: name.trim(),
    ...(breed !== undefined && { breed: optionalText(breed) }),
    ...(birthDate !== undefined && {
      birthDate: birthDate ? new Date(birthDate) : null,
    }),
  };
}

@ApiTags("dogs")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("dogs")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class DogsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatars: DogAvatarsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List dogs owned by the signed-in user" })
  getDogs(@User() user: Identity): Promise<DogDetails[]> {
    return this.prisma.dog.findMany({
      where: { userId: user.id, archivedAt: null },
      omit: omitAvatar,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an owned dog and its discipline progress" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  async getDog(@User() user: Identity, @Param("id") id: string) {
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 86400000);
    const dog = await this.prisma.dog.findFirst({
      where: { id, userId: user.id },
      omit: omitAvatar,
      include: {
        disciplines: {
          include: { discipline: true },
          orderBy: { createdAt: "asc" },
        },
        goals: { include: { goal: true, exercises: true } },
      },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    const { disciplines, goals, ...details } = dog;
    const disciplineIds = disciplines.map((item) => item.discipline.id);
    const trainingWhere = {
      dogId: id,
      deletedAt: null,
      completedAt: { not: null, lte: now },
      exercise: { goal: { disciplineId: { in: disciplineIds } } },
    };
    const [recentRatings, latestTrainings, exercises] = await Promise.all([
      this.prisma.scheduledExercise.groupBy({
        by: ["exerciseId"],
        where: { ...trainingWhere, completedAt: { gte: since, lte: now } },
        _sum: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.scheduledExercise.groupBy({
        by: ["exerciseId"],
        where: trainingWhere,
        _max: { completedAt: true },
      }),
      this.prisma.exercise.findMany({
        where: { goal: { disciplineId: { in: disciplineIds } } },
        select: { id: true, goal: { select: { disciplineId: true } } },
      }),
    ]);
    const disciplineByExercise = new Map(
      exercises.map((exercise) => [exercise.id, exercise.goal.disciplineId]),
    );
    const ratings = new Map<string, { total: number; count: number }>();
    for (const exercise of recentRatings) {
      const disciplineId = disciplineByExercise.get(exercise.exerciseId);
      if (
        !disciplineId ||
        exercise._sum.rating === null ||
        !exercise._count.rating
      )
        continue;
      const aggregate = ratings.get(disciplineId) ?? { total: 0, count: 0 };
      aggregate.total += exercise._sum.rating;
      aggregate.count += exercise._count.rating;
      ratings.set(disciplineId, aggregate);
    }
    const lastTraining = new Map<string, Date>();
    const exerciseTraining = new Map<string, Map<string, Date>>();
    for (const exercise of latestTrainings) {
      const disciplineId = disciplineByExercise.get(exercise.exerciseId);
      const completedAt = exercise._max.completedAt;
      if (!disciplineId || !completedAt) continue;
      const previous = lastTraining.get(disciplineId);
      if (!previous || completedAt > previous)
        lastTraining.set(disciplineId, completedAt);
      const dates =
        exerciseTraining.get(disciplineId) ?? new Map<string, Date>();
      dates.set(exercise.exerciseId, completedAt);
      exerciseTraining.set(disciplineId, dates);
    }
    return {
      ...details,
      disciplines: disciplines.map(({ discipline }) => {
        const selected = goals.filter(
          (item) => item.goal.disciplineId === discipline.id,
        );
        const rating = ratings.get(discipline.id);
        return {
          id: discipline.id,
          name: discipline.name,
          description: discipline.description,
          averageRating: rating ? rating.total / rating.count : null,
          lastTrainingAt: lastTraining.get(discipline.id) ?? null,
          exerciseTraining: Array.from(
            exerciseTraining.get(discipline.id) ?? [],
            ([exerciseId, lastTrainingAt]) => ({ exerciseId, lastTrainingAt }),
          ),
          goalCount: selected.length,
          completedGoalCount: selected.filter((item) => item.completedAt)
            .length,
          exerciseCount: selected.reduce(
            (total, item) => total + item.exercises.length,
            0,
          ),
        };
      }),
    };
  }

  @Post(":id/disciplines")
  @ApiOperation({
    summary: "Create a library discipline and assign it to an owned dog",
  })
  createDiscipline(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: DisciplineInputDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const dog = await tx.dog.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!dog) throw new NotFoundException("Dog not found");
      return tx.discipline.create({
        data: {
          name: body.name.trim(),
          description: optionalText(body.description),
          userId: user.id,
          dogs: { create: { dogId: dog.id } },
        },
      });
    });
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archive an owned dog, keeping all its data" })
  async archiveDog(@User() user: Identity, @Param("id") id: string) {
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId: user.id },
      data: { archivedAt: new Date() },
      omit: omitAvatar,
    });
    if (!dog) throw new NotFoundException("Dog not found");
    return dog;
  }

  @Post()
  @ApiOperation({ summary: "Create a dog owned by the signed-in user" })
  @ApiBadRequestResponse({ description: "Invalid dog data" })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: AVATAR_UPLOAD_LIMIT, files: 1, fields: 3 },
    }),
  )
  async createDog(
    @User() user: Identity,
    @Body() body: DogInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<DogDetails> {
    const avatar = file ? await this.avatars.prepareAvatar(file.buffer) : {};
    return this.prisma.dog.create({
      data: {
        ...dogFields(body),
        userId: user.id,
        ...avatar,
      },
      omit: omitAvatar,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a dog owned by the signed-in user" })
  @ApiBadRequestResponse({ description: "Invalid dog data" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  async updateDog(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: DogInputDto,
  ): Promise<DogDetails> {
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId: user.id },
      data: dogFields(body),
      omit: omitAvatar,
    });

    if (!dog) throw new NotFoundException("Dog not found");

    return dog;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a dog owned by the signed-in user" })
  @ApiNoContentResponse({ description: "Dog deleted" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  async deleteDog(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<void> {
    const { count } = await this.prisma.dog.deleteMany({
      where: { id, userId: user.id },
    });

    if (count === 0) throw new NotFoundException("Dog not found");
  }
}
