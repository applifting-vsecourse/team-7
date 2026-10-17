import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { DogsController } from "./controllers/dogs.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DogsController],
})
export class DogsModule {}
