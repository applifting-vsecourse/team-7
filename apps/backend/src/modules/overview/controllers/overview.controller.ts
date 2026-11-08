import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { OverviewService } from "@/modules/overview/services/overview.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { OverviewQueryDto } from "./dto/overview-query.dto";

@ApiTags("overview")
@ApiCookieAuth()
@Controller("overview")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get()
  @ApiOperation({
    summary:
      "Get weekly statistics, today, tomorrow, all overdue exercises and disciplines without training this week for owned active dogs",
  })
  get(@User() user: Identity, @Query() query: OverviewQueryDto) {
    return this.overview.get(user.id, query);
  }
}
