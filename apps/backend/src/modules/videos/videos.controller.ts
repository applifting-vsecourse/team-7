import {
  CallHandler,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  HttpCode,
  Injectable,
  NestInterceptor,
  Param,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import type {} from "multer";
import { finalize } from "rxjs";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { VideoStorageService } from "./video-storage.service";
import { VIDEO_MAX_BYTES, VIDEO_UPLOAD_DIRECTORY } from "./videos.constants";
import { VideosService } from "./videos.service";

@Injectable()
export class VideoOwnerGuard implements CanActivate {
  constructor(private readonly videos: VideosService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { session: { user: Identity } }>();
    await this.videos.assertAccess(
      request.session.user.id,
      String(request.params.dogId),
      String(request.params.exerciseId),
    );
    return true;
  }
}

/** Reject before Multer writes to disk; at most two temporary uploads per process. */
@Injectable()
export class VideoUploadInterceptor implements NestInterceptor {
  private uploads = 0;
  constructor(private readonly storage: VideoStorageService) {}
  intercept(_context: ExecutionContext, next: CallHandler) {
    this.storage.assertEnabled();
    if (this.uploads >= 2)
      throw new ServiceUnavailableException(
        "Video uploads are busy; try again later",
      );
    this.uploads++;
    return next.handle().pipe(
      finalize(() => {
        this.uploads--;
      }),
    );
  }
}

@ApiTags("exercise videos")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@UseGuards(AuthenticatedUserGuard, VideoOwnerGuard)
@Controller("dogs/:dogId/exercises/:exerciseId/videos")
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({
    summary:
      "Queue an exercise video (MP4/MOV/WebM, 30 MB, 60 seconds; validated asynchronously)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    VideoUploadInterceptor,
    FileInterceptor("file", {
      dest: VIDEO_UPLOAD_DIRECTORY,
      limits: { fileSize: VIDEO_MAX_BYTES, files: 1, fields: 0, parts: 1 },
    }),
  )
  upload(
    @User() user: Identity,
    @Param("dogId") dogId: string,
    @Param("exerciseId") exerciseId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.videos.upload(user.id, dogId, exerciseId, file);
  }

  @Get()
  @ApiOperation({ summary: "List exercise video statuses (latest 100)" })
  list(
    @User() user: Identity,
    @Param("dogId") dogId: string,
    @Param("exerciseId") exerciseId: string,
  ) {
    return this.videos.list(user.id, dogId, exerciseId);
  }

  @Get(":id/playback")
  @ApiOperation({
    summary: "Get a private video's playback URL, valid for one hour",
  })
  playback(
    @User() user: Identity,
    @Param("dogId") dogId: string,
    @Param("exerciseId") exerciseId: string,
    @Param("id") id: string,
  ) {
    return this.videos.playback(user.id, dogId, exerciseId, id);
  }

  @Delete(":id")
  @HttpCode(202)
  @ApiOperation({
    summary: "Queue deletion of a video and its storage objects",
  })
  remove(
    @User() user: Identity,
    @Param("dogId") dogId: string,
    @Param("exerciseId") exerciseId: string,
    @Param("id") id: string,
  ) {
    return this.videos.remove(user.id, dogId, exerciseId, id);
  }
}
