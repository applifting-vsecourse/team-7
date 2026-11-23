import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { SubscriptionService } from "@/modules/users/services/subscription.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import {
  ActiveDogDto,
  SubscriptionActionDto,
  SubscriptionDto,
} from "./dto/subscription.dto";

@ApiTags("subscription")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("users/me/subscription")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: "Get the signed-in user's mock subscription" })
  @ApiOkResponse({ type: SubscriptionDto })
  get(@User() user: Identity) {
    return this.subscriptions.current(user.id);
  }

  @Get("dog-choices")
  @ApiOperation({
    summary: "List the minimal dog choices required after Plus expires",
  })
  dogChoices(@User() user: Identity) {
    return this.subscriptions.dogChoices(user.id);
  }

  @Post("active-dog")
  @ApiOperation({
    summary:
      "Choose the single active dog after Plus expires; selection lasts until Plus is restored",
  })
  @ApiOkResponse({ type: SubscriptionDto })
  chooseDog(@User() user: Identity, @Body() body: ActiveDogDto) {
    return this.subscriptions.chooseDog(user.id, body.dogId);
  }

  @Post()
  @ApiOperation({ summary: "Simulate a subscription action (no real payment)" })
  @ApiOkResponse({ type: SubscriptionDto })
  @ApiBadRequestResponse({
    description: "Invalid action or subscription state",
  })
  update(@User() user: Identity, @Body() body: SubscriptionActionDto) {
    return this.subscriptions.update(user.id, body.action, body.billingPeriod);
  }
}
