import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import {
  EmailChangeIdDto,
  PendingEmailChangeResponseDto,
} from "./dto/pending-email-change.dto";

@ApiTags("user settings")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@Controller("users/me/settings/email-change")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class EmailChangeController {
  constructor(private readonly changes: EmailChangeService) {}

  @Get()
  @ApiOperation({ summary: "Get the signed-in user's pending email change" })
  @ApiOkResponse({ type: PendingEmailChangeResponseDto })
  async get(@User() user: Identity) {
    return { pendingEmailChange: await this.changes.pending(user.id) };
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Cancel the signed-in user's pending email change" })
  @ApiNoContentResponse({
    description: "The confirmation link has been revoked",
  })
  @ApiConflictResponse({
    description:
      "The request has already completed, been cancelled or replaced",
  })
  cancel(@User() user: Identity, @Param() params: EmailChangeIdDto) {
    return this.changes.cancel(user.id, params.id);
  }
}
