import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PrismaService } from "@/core/prisma/prisma.service";
import { findActiveDog } from "@/modules/dogs/domain/owned-dog";
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
import { DISCIPLINE_CATALOG } from "@/modules/onboarding/domain/discipline-catalog";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import {
  CatalogCopyDto,
  CatalogQueryDto,
  OnboardingQueryDto,
  OnboardingUpdateDto,
} from "./dto/onboarding.dto";

const stateSelect = {
  onboardingStatus: true,
  onboardingStep: true,
  onboardingCardHidden: true,
} as const;

@ApiTags("onboarding")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@ApiBadRequestResponse({ description: "Invalid input" })
@Controller("onboarding")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class OnboardingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selections: DogSelectionService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "Tour state and the handler's progress (dog, discipline, plan this week)",
  })
  async get(@User() user: Identity, @Query() query: OnboardingQueryDto) {
    const weekStart = new Date(query.weekStart);
    const activeDog = { userId: user.id, archivedAt: null };
    const [state, dog, disciplines, planned] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: stateSelect,
      }),
      // The tour works with the newest dog, its newest discipline and event.
      this.prisma.dog.findFirst({
        where: activeDog,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          disciplines: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { disciplineId: true },
          },
          scheduledExercises: {
            where: { deletedAt: null, kind: "exercise" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      }),
      this.prisma.dogDiscipline.count({ where: { dog: activeDog } }),
      this.prisma.scheduledExercise.count({
        where: {
          dog: activeDog,
          deletedAt: null,
          startsAt: {
            gte: weekStart,
            lt: new Date(weekStart.getTime() + 7 * 86_400_000),
          },
        },
      }),
    ]);
    return {
      status: state.onboardingStatus,
      step: state.onboardingStep,
      cardHidden: state.onboardingCardHidden,
      hasDog: !!dog,
      hasDiscipline: disciplines > 0,
      hasWeekPlan: planned > 0,
      dogId: dog?.id ?? null,
      disciplineId: dog?.disciplines[0]?.disciplineId ?? null,
      eventId: dog?.scheduledExercises[0]?.id ?? null,
    };
  }

  @Patch()
  @ApiOperation({ summary: "Start, move, leave or finish the tour" })
  async update(@User() user: Identity, @Body() body: OnboardingUpdateDto) {
    const state = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStatus: body.status,
        onboardingStep: body.step,
        onboardingCardHidden: body.cardHidden,
      },
      select: stateSelect,
    });
    return {
      status: state.onboardingStatus,
      step: state.onboardingStep,
      cardHidden: state.onboardingCardHidden,
    };
  }

  @Get("catalog")
  @ApiOperation({ summary: "Prefilled disciplines offered by the tour" })
  catalog(@Query() { lng }: CatalogQueryDto) {
    // Index-based ids keep the shape of a library discipline, so a selection
    // looks like any other dog selection.
    return DISCIPLINE_CATALOG.map((discipline) => ({
      key: discipline.key,
      name: discipline.name[lng],
      goals: discipline.goals.map((goal, goalIndex) => ({
        id: String(goalIndex),
        name: goal.name[lng],
        exercises: goal.exercises.map((exercise, index) => ({
          id: `${goalIndex}.${index}`,
          name: exercise.name[lng],
        })),
      })),
    }));
  }

  @Post("catalog/:key")
  @ApiOperation({
    summary:
      "Copy a prefilled discipline into the library and assign the selected goals to the dog",
  })
  @ApiNotFoundResponse({ description: "Dog or catalog discipline not found" })
  copy(
    @User() user: Identity,
    @Param("key") key: string,
    @Body() body: CatalogCopyDto,
  ) {
    const source = DISCIPLINE_CATALOG.find((item) => item.key === key);
    if (!source) throw new NotFoundException("Catalog discipline not found");
    if (!body.goals.length)
      throw new BadRequestException("Select at least one goal");
    const { lng } = body;
    // One transaction: a failed save leaves no half-copied discipline.
    return this.prisma.$transaction(async (tx) => {
      await findActiveDog(tx, user.id, body.dogId);
      const discipline = await tx.discipline.create({
        data: { userId: user.id, name: source.name[lng] },
      });
      const ids = new Map<string, string>();
      for (const [goalIndex, goal] of source.goals.entries()) {
        const created = await tx.goal.create({
          data: {
            disciplineId: discipline.id,
            name: goal.name[lng],
            exercises: {
              create: goal.exercises.map((exercise, position) => ({
                name: exercise.name[lng],
                position,
              })),
            },
          },
          include: { exercises: { orderBy: { position: "asc" } } },
        });
        ids.set(String(goalIndex), created.id);
        created.exercises.forEach((exercise, index) =>
          ids.set(`${goalIndex}.${index}`, exercise.id),
        );
      }
      const map = (id: string) => {
        const mapped = ids.get(id);
        if (!mapped) throw new BadRequestException("Unknown catalog item");
        return mapped;
      };
      await this.selections.replace(
        tx,
        { userId: user.id, dogId: body.dogId, disciplineId: discipline.id },
        body.goals.map((goal) => ({
          goalId: map(goal.goalId),
          exerciseIds: goal.exerciseIds.map(map),
        })),
      );
      return discipline;
    });
  }
}
