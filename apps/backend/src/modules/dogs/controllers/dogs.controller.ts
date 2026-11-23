import {
  Body,
  ConflictException,
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
  ApiConflictResponse,
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
import { findActiveDog } from "@/modules/dogs/domain/owned-dog";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import {
  assertDogAccess,
  lockSubscription,
  subscriptionAccess,
  subscriptionRequired,
} from "@/shared/subscription/subscription-access";
import { dogLimit } from "@/shared/subscription/subscription.constants";
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
  async getDogs(@User() user: Identity) {
    const access = await subscriptionAccess(this.prisma, user.id);
    const dogs = await this.prisma.dog.findMany({
      where: { userId: user.id, archivedAt: null },
      omit: omitAvatar,
    });
    return dogs.map((dog) =>
      access.isPlus || dog.id === access.activeDogId
        ? dog
        : {
            id: dog.id,
            name: dog.name,
            avatarVersion: dog.avatarVersion,
            locked: true,
          },
    );
  }

  // Declared before ":id" so "archived" is not captured as a dog ID.
  @Get("archived")
  @ApiOperation({
    summary: "List archived dogs owned by the signed-in user, newest first",
  })
  async getArchivedDogs(@User() user: Identity) {
    const access = await subscriptionAccess(this.prisma, user.id);
    const dogs = await this.prisma.dog.findMany({
      where: { userId: user.id, archivedAt: { not: null } },
      orderBy: { archivedAt: "desc" },
      omit: omitAvatar,
    });
    return dogs.map((dog) =>
      access.isPlus
        ? dog
        : {
            id: dog.id,
            name: dog.name,
            avatarVersion: dog.avatarVersion,
            archivedAt: dog.archivedAt,
            locked: true,
          },
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an owned dog and its discipline progress" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  async getDog(@User() user: Identity, @Param("id") id: string) {
    await assertDogAccess(this.prisma, user.id, id);
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
    // Lessons with a trainer (#70) have no exercise and no discipline.
    for (const exercise of recentRatings) {
      const disciplineId = disciplineByExercise.get(exercise.exerciseId ?? "");
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
    for (const { exerciseId, _max } of latestTrainings) {
      const disciplineId = disciplineByExercise.get(exerciseId ?? "");
      const completedAt = _max.completedAt;
      if (!exerciseId || !disciplineId || !completedAt) continue;
      const previous = lastTraining.get(disciplineId);
      if (!previous || completedAt > previous)
        lastTraining.set(disciplineId, completedAt);
      const dates =
        exerciseTraining.get(disciplineId) ?? new Map<string, Date>();
      dates.set(exerciseId, completedAt);
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
          completedGoalCount: selected.filter(
            (item) => item.status === "completed",
          ).length,
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
      const dog = await findActiveDog(tx, user.id, id);
      return tx.discipline.create({
        data: {
          name: body.name.trim(),
          description: optionalText(body.description),
          category: body.category,
          userId: user.id,
          dogs: { create: { dogId: dog.id } },
        },
      });
    });
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archive an owned dog, keeping all its data" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  @ApiConflictResponse({ description: "Dog is already archived" })
  async archiveDog(@User() user: Identity, @Param("id") id: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockSubscription(tx, user.id);
      // Archiving a locked dog is allowed on Free: it only tidies up the list.
      const owned = await tx.dog.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!owned) throw new NotFoundException("Dog not found");
      // On Free the active dog stays the active dog until Plus is renewed.
      // Any other dog, archived ones included, could take its place (archive
      // this one, restore that one), so archiving it is refused.
      const access = await subscriptionAccess(tx, user.id);
      if (
        !access.isPlus &&
        access.activeDogId === id &&
        (await tx.dog.count({ where: { userId: user.id, id: { not: id } } })) >
          0
      )
        throw subscriptionRequired("activeDogArchive");
      // The archivedAt condition keeps a concurrent archive from overwriting the date.
      const [dog] = await tx.dog.updateManyAndReturn({
        where: { id, userId: user.id, archivedAt: null },
        data: { archivedAt: new Date() },
        omit: omitAvatar,
      });
      if (!dog) throw new ConflictException("Dog is already archived");
      return dog;
    });
  }

  @Post(":id/restore")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Restore an archived dog; its scheduled exercises reappear",
  })
  @ApiNotFoundResponse({ description: "Dog not found" })
  @ApiConflictResponse({ description: "Dog is not archived" })
  async restoreDog(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<DogDetails> {
    return this.prisma.$transaction(async (tx) => {
      await lockSubscription(tx, user.id);
      const owned = await tx.dog.findFirst({
        where: { id, userId: user.id },
        select: { archivedAt: true },
      });
      if (!owned) throw new NotFoundException("Dog not found");
      if (!owned.archivedAt) throw new ConflictException("Dog is not archived");
      const access = await subscriptionAccess(tx, user.id);
      if (
        (await tx.dog.count({
          where: { userId: user.id, archivedAt: null },
        })) >= dogLimit(access.isPlus)
      )
        throw subscriptionRequired("dogLimit");
      const [dog] = await tx.dog.updateManyAndReturn({
        where: { id, userId: user.id, archivedAt: { not: null } },
        data: { archivedAt: null },
        omit: omitAvatar,
      });
      if (!dog) throw new ConflictException("Dog is not archived");
      return dog;
    });
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
    return this.prisma.$transaction(async (tx) => {
      await lockSubscription(tx, user.id);
      const access = await subscriptionAccess(tx, user.id);
      if (
        (await tx.dog.count({
          where: { userId: user.id, archivedAt: null },
        })) >= dogLimit(access.isPlus)
      )
        throw subscriptionRequired("dogLimit");
      return tx.dog.create({
        data: { ...dogFields(body), userId: user.id, ...avatar },
        omit: omitAvatar,
      });
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a dog owned by the signed-in user" })
  @ApiBadRequestResponse({ description: "Invalid dog data" })
  @ApiNotFoundResponse({ description: "Dog not found" })
  @ApiConflictResponse({ description: "Dog is archived" })
  async updateDog(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: DogInputDto,
  ): Promise<DogDetails> {
    await findActiveDog(this.prisma, user.id, id);
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId: user.id, archivedAt: null },
      data: dogFields(body),
      omit: omitAvatar,
    });

    if (!dog) throw new ConflictException("Dog is archived");

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
    // Deleting is allowed for locked and archived dogs on Free too.
    const { count } = await this.prisma.dog.deleteMany({
      where: { id, userId: user.id },
    });

    if (count === 0) throw new NotFoundException("Dog not found");
  }
}
