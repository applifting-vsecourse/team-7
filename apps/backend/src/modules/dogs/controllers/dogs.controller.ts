import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Dog } from "@/generated/prisma/client";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";

@ApiTags("dogs")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("dogs")
@UseGuards(AuthenticatedUserGuard)
export class DogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List dogs owned by the signed-in user" })
  getDogs(@User() user: Identity): Promise<Dog[]> {
    return this.prisma.dog.findMany({
      where: { userId: user.id },
    });
  }
}
