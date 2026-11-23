import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { PrismaService } from "@/core/prisma/prisma.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import {
  findCatalogDiscipline,
  localizeCatalog,
  type LocalizedCatalog,
} from "@/shared/domain/discipline-catalog";
import { CatalogCopyDto, CatalogLanguageDto } from "./dto/catalog.dto";

const isUniqueViolation = (error: unknown) =>
  (error as { code?: unknown } | null)?.code === "P2002";

@ApiTags("catalog")
@Controller("catalog")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  // Public: the landing page shows it before sign-in.
  @Get()
  @ApiOperation({ summary: "Ready-made disciplines by category (public)" })
  @ApiBadRequestResponse({ description: "Unsupported language" })
  getCatalog(@Query() query: CatalogLanguageDto): LocalizedCatalog {
    return localizeCatalog(query.lng);
  }

  @Post(":key/copy")
  @UseGuards(AuthenticatedUserGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Copy a catalog discipline into the signed-in user's library",
    description: "Returns the existing copy (200) instead of a second one.",
  })
  @ApiCreatedResponse({ type: CatalogCopyDto, description: "Copy created" })
  @ApiOkResponse({ type: CatalogCopyDto, description: "Already copied" })
  @ApiNotFoundResponse({ description: "Unknown catalog discipline" })
  @ApiUnauthorizedResponse({ description: "Authentication required" })
  async copy(
    @User() user: Identity,
    @Param("key") key: string,
    @Body() { lng }: CatalogLanguageDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CatalogCopyDto> {
    const found = findCatalogDiscipline(key);
    if (!found) throw new NotFoundException("Catalog discipline not found");

    const existing = () =>
      this.prisma.discipline.findUnique({
        where: { userId_catalogKey: { userId: user.id, catalogKey: key } },
        select: { id: true },
      });
    const reuse = ({ id }: { id: string }) => {
      response.status(200);
      return { id, created: false };
    };

    const copy = await existing();
    if (copy) return reuse(copy);

    const { category, discipline } = found;
    try {
      const { id } = await this.prisma.discipline.create({
        data: {
          userId: user.id,
          name: discipline.name[lng],
          description: discipline.description[lng],
          category: category.key,
          catalogKey: key,
          goals: {
            create: discipline.goals.map((goal) => ({
              name: goal.name[lng],
              criterion: goal.criterion[lng],
              exercises: {
                create: goal.exercises.map((exercise, position) => ({
                  name: exercise.name[lng],
                  procedure: exercise.procedure[lng],
                  position,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });
      return { id, created: true };
    } catch (error) {
      // A parallel request copied it first.
      const copy = isUniqueViolation(error) ? await existing() : null;
      if (!copy) throw error;
      return reuse(copy);
    }
  }
}
