import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import type {} from "multer";
import type { DogDetails } from "@/modules/dogs/domain/dog-details";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { AVATAR_UPLOAD_LIMIT } from "./avatars.constants";
import { DogAvatarsService } from "./avatars.service";

@ApiTags("dogs")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("dogs/:id/avatar")
@UseGuards(AuthenticatedUserGuard)
export class DogAvatarsController {
  constructor(private readonly avatars: DogAvatarsService) {}

  @Get()
  @ApiOperation({ summary: "Get an owned dog's avatar" })
  async getAvatar(
    @User() user: Identity,
    @Param("id") id: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const { bytes, version, mimeType } = await this.avatars.getAvatar(
      user.id,
      id,
    );
    const etag = `"${version}"`;
    response.set({
      "Cache-Control": "private, no-cache",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    });
    if (ifNoneMatch === etag) {
      response.status(304).end();
      return;
    }
    response.type(mimeType).send(bytes);
  }

  @Put()
  @ApiOperation({ summary: "Upload an owned dog's avatar" })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: AVATAR_UPLOAD_LIMIT, files: 1, fields: 0 },
    }),
  )
  uploadAvatar(
    @User() user: Identity,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DogDetails> {
    return this.avatars.uploadAvatar(user.id, id, file?.buffer);
  }

  @Delete()
  @ApiOperation({ summary: "Remove an owned dog's avatar" })
  removeAvatar(
    @User() user: Identity,
    @Param("id") id: string,
  ): Promise<DogDetails> {
    return this.avatars.removeAvatar(user.id, id);
  }
}
