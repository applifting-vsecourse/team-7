import { ConfigModule } from "@applifting-io/nestjs-decorated-config";
import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { Config } from "@/shared/config/config.service";
import { VideoStorageService } from "./video-storage.service";
import { VideoTranscoderService } from "./video-transcoder.service";
import { VideoWorkerService } from "./video-worker.service";
import {
  VideoOwnerGuard,
  VideosController,
  VideoUploadInterceptor,
} from "./videos.controller";
import { VideosService } from "./videos.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRootAsync(Config, { validate: true }),
  ],
  controllers: [VideosController],
  providers: [
    VideosService,
    VideoStorageService,
    VideoTranscoderService,
    VideoWorkerService,
    VideoOwnerGuard,
    VideoUploadInterceptor,
  ],
})
export class VideosModule {}
