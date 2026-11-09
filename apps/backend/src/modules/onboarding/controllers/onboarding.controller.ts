import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { OnboardingService } from "@/modules/onboarding/services/onboarding.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { OnboardingQueryDto, OnboardingUpdateDto } from "./dto/onboarding.dto";

@ApiTags("onboarding")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@ApiBadRequestResponse({ description: "Invalid input" })
@Controller("onboarding")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  @ApiOperation({
    summary:
      "Tour state and the handler's progress (dog, discipline, plan this week)",
  })
  get(@User() user: Identity, @Query() query: OnboardingQueryDto) {
    return this.onboarding.get(user.id, new Date(query.weekStart));
  }

  @Patch()
  @ApiOperation({ summary: "Start, move, leave or finish the tour" })
  update(@User() user: Identity, @Body() body: OnboardingUpdateDto) {
    return this.onboarding.update(user.id, body);
  }
}
