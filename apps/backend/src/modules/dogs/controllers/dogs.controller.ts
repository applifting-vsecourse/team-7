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
import { Dog } from "@/generated/prisma/client";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { DogInputDto } from "./dto/dog-input.dto";

@ApiTags("dogs")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("dogs")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class DogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List dogs owned by the signed-in user" })
  getDogs(@User() user: Identity): Promise<Dog[]> {
    return this.prisma.dog.findMany({
      where: { userId: user.id },
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a dog owned by the signed-in user" })
  @ApiBadRequestResponse({ description: "Invalid dog data" })
  createDog(@User() user: Identity, @Body() body: DogInputDto): Promise<Dog> {
    return this.prisma.dog.create({
      data: { text: body.text, userId: user.id },
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
  ): Promise<Dog> {
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId: user.id },
      data: { text: body.text },
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
