import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { DogExerciseDetailsService } from "@/modules/dogs/services/dog-exercise-details.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";

@ApiTags("dogs")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@ApiNotFoundResponse({ description: "Dog or exercise not found" })
@UseGuards(AuthenticatedUserGuard)
@Controller("dogs/:dogId/exercises/:exerciseId")
export class DogExerciseDetailsController {
  constructor(private readonly details: DogExerciseDetailsService) {}

  @Get()
  @ApiOperation({
    summary:
      "Get an owned dog's exercise and training history, including removed assignments",
  })
  get(
    @User() user: Identity,
    @Param("dogId") dogId: string,
    @Param("exerciseId") exerciseId: string,
  ) {
    return this.details.get(user.id, dogId, exerciseId);
  }
}
