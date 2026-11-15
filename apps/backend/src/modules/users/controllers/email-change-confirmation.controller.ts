import {
  Controller,
  Get,
  GoneException,
  Query,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import {
  type BetterAuth,
  InjectBetterAuth,
} from "@/shared/auth/providers/better-auth.provider";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import { Config } from "@/shared/config/config.service";
import { EmailChangeConfirmationDto } from "./dto/email-change-confirmation.dto";

@ApiTags("user settings")
@Controller("users/email-change/confirm")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class EmailChangeConfirmationController {
  constructor(
    private readonly changes: EmailChangeService,
    @InjectBetterAuth private readonly auth: BetterAuth,
    private readonly config: Config,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Confirm an active email change using its emailed link",
  })
  async confirm(
    @Query() query: EmailChangeConfirmationDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    const failure = new URL("/settings", this.config.frontendUrl);
    failure.searchParams.set("emailChange", "invalid");
    if (query.lng) failure.searchParams.set("lng", query.lng);
    try {
      const result = await this.changes.confirm(query.token, (token) =>
        this.auth.api.verifyEmail({
          query: { token },
          headers: fromNodeHeaders(request.headers),
          asResponse: true,
        }),
      );
      if (!result.response.ok) return response.redirect(303, failure.href);
      const cookies = result.response.headers.getSetCookie();
      if (cookies.length) response.setHeader("Set-Cookie", cookies);
      const callback = new URL(result.callbackUrl);
      callback.searchParams.set("emailChange", "confirmed");
      return response.redirect(303, callback.href);
    } catch (error) {
      if (error instanceof GoneException)
        return response.redirect(303, failure.href);
      throw error;
    }
  }
}
