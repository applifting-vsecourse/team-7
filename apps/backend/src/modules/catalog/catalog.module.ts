import { Module } from "@nestjs/common";
import { PrismaModule } from "@/core/prisma/prisma.module";
import { AuthModule } from "@/shared/auth/auth.module";
import { CatalogController } from "./controllers/catalog.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
