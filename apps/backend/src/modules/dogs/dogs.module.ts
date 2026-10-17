import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { DogAvatarsController } from "./avatars/avatars.controller";
import { DogAvatarsService } from "./avatars/avatars.service";
import { DogsController } from "./controllers/dogs.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DogsController, DogAvatarsController],
  providers: [DogAvatarsService],
})
export class DogsModule {}
