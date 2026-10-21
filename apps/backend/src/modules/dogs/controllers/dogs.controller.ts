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
      where: { userId: user.id },
      omit: omitAvatar,
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
