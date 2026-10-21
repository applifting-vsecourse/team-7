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
import type { Discipline, Goal } from "@/generated/prisma/client";
import {
  disciplineDetailInclude,
  disciplineSummaryInclude,
  optionalText,
  toDisciplineDetail,
  toDisciplineSummary,
  type DisciplineDetail,
  type DisciplineSummary,
} from "@/modules/disciplines/domain/discipline-details";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { DisciplineInputDto, GoalInputDto } from "./dto/library-input.dto";

@ApiTags("disciplines")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("disciplines")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class DisciplinesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List disciplines owned by the signed-in user" })
  async getDisciplines(@User() user: Identity): Promise<DisciplineSummary[]> {
    const rows = await this.prisma.discipline.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: disciplineSummaryInclude,
    });
    return rows.map(toDisciplineSummary);
  }

  @Post()
  @ApiOperation({ summary: "Create a discipline owned by the signed-in user" })
  @ApiBadRequestResponse({ description: "Invalid discipline data" })
  createDiscipline(
    @User() user: Identity,
    @Body() body: DisciplineInputDto,
  ): Promise<Discipline> {
    return this.prisma.discipline.create({
      data: {
        name: body.name.trim(),
        description: optionalText(body.description),
        userId: user.id,
      },
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a discipline with its goals and exercises" })
  @ApiNotFoundResponse({ description: "Discipline not found" })
  async getDiscipline(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<DisciplineDetail> {
    const row = await this.prisma.discipline.findFirst({
      where: { id, userId: user.id },
      include: disciplineDetailInclude,
    });

    if (!row) throw new NotFoundException("Discipline not found");

    return toDisciplineDetail(row);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a discipline's name and description" })
  @ApiBadRequestResponse({ description: "Invalid discipline data" })
  @ApiNotFoundResponse({ description: "Discipline not found" })
  async updateDiscipline(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: DisciplineInputDto,
  ): Promise<Discipline> {
    const [discipline] = await this.prisma.discipline.updateManyAndReturn({
      where: { id, userId: user.id },
      data: {
        name: body.name.trim(),
        description: optionalText(body.description),
      },
    });

    if (!discipline) throw new NotFoundException("Discipline not found");

    return discipline;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a discipline with its goals, exercises and dog picks",
  })
  @ApiNoContentResponse({ description: "Discipline deleted" })
  @ApiNotFoundResponse({ description: "Discipline not found" })
  async deleteDiscipline(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<void> {
    const { count } = await this.prisma.discipline.deleteMany({
      where: { id, userId: user.id },
    });

    if (count === 0) throw new NotFoundException("Discipline not found");
  }

  @Post(":id/goals")
  @ApiOperation({ summary: "Add a goal to a discipline" })
  @ApiBadRequestResponse({ description: "Invalid goal data" })
  @ApiNotFoundResponse({ description: "Discipline not found" })
  async createGoal(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() body: GoalInputDto,
  ): Promise<Goal> {
    const discipline = await this.prisma.discipline.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!discipline) throw new NotFoundException("Discipline not found");

    return this.prisma.goal.create({
      data: {
        name: body.name.trim(),
        criterion: optionalText(body.criterion),
        disciplineId: discipline.id,
      },
    });
  }
}
