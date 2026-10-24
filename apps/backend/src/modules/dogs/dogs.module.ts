import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { DogAvatarsController } from "./avatars/avatars.controller";
import { DogAvatarsService } from "./avatars/avatars.service";
import { DogSelectionController } from "./controllers/dog-selection.controller";
import { DogsController } from "./controllers/dogs.controller";
import { DogSelectionService } from "./services/dog-selection.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DogsController, DogAvatarsController, DogSelectionController],
  providers: [DogAvatarsService, DogSelectionService],
})
export class DogsModule {}
