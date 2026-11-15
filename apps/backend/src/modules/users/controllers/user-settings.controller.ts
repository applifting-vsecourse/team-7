import {
  Body,
  Controller,
  Get,
  Patch,
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
import { UserSettingsService } from "@/modules/users/services/user-settings.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { AccountSummaryDto } from "./dto/account-summary.dto";
import { UserSettingsDto } from "./dto/user-settings.dto";

@ApiTags("user settings")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("users/me/settings")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class UserSettingsController {
  constructor(private readonly settings: UserSettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get the signed-in user's settings" })
  @ApiOkResponse({ type: UserSettingsDto })
  get(@User() user: Identity) {
    return this.settings.get(user.id);
  }

  @Get("summary")
  @ApiOperation({
    summary: "Count the signed-in user's data before account deletion",
  })
  @ApiOkResponse({ type: AccountSummaryDto })
  summary(@User() user: Identity) {
    return this.settings.summary(user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Update the signed-in user's settings" })
  @ApiOkResponse({ type: UserSettingsDto })
  @ApiBadRequestResponse({ description: "Invalid settings" })
  update(@User() user: Identity, @Body() body: UserSettingsDto) {
    return this.settings.update(user.id, body);
  }
}
