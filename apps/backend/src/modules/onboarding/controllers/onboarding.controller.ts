import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PrismaService } from "@/core/prisma/prisma.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { OnboardingQueryDto, OnboardingUpdateDto } from "./dto/onboarding.dto";

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
  constructor(private readonly prisma: PrismaService) {}

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
          _count: { select: { goals: true } },
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
    // An own discipline starts empty; the tour waits for its first exercise.
    const exercises = dog
      ? await this.prisma.dogExercise.count({ where: { dogId: dog.id } })
      : 0;
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
      hasGoal: (dog?._count.goals ?? 0) > 0,
      hasExercise: exercises > 0,
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
}
