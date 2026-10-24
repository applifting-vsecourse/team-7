import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { EventsService } from "@/modules/events/services/events.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import { ScheduleInputDto } from "./dto/schedule-input.dto";

@ApiTags("events")
@ApiCookieAuth()
@Controller("events")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Get()
  @ApiOperation({
    summary: "List scheduled exercises owned by the signed-in user",
  })
  list(@User() user: Identity) {
    return this.events.list(user.id);
  }

  @Get("dogs/:dogId/exercises")
  @ApiOperation({
    summary: "List assigned exercises available to schedule for an owned dog",
  })
  exercises(@User() user: Identity, @Param("dogId") dogId: string) {
    return this.events.exercises(user.id, dogId);
  }

  @Post()
  @ApiOperation({
    summary: "Schedule assigned exercises for an owned dog atomically",
  })
  schedule(@User() user: Identity, @Body() input: ScheduleInputDto) {
    return this.events.schedule(user.id, input);
  }
}
