import {
  Body,
  Query,
  Patch,
  Delete,
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
import {
  CompleteEventDto,
  MoveEventDto,
  UndoEventDto,
} from "./dto/event-action.dto";
import { ListEventsDto } from "./dto/list-events.dto";
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
  list(@User() user: Identity, @Query() range: ListEventsDto) {
    return this.events.list(user.id, range);
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
  @Patch(":id/result")
  @ApiOperation({
    summary: "Complete an owned exercise or edit its rating and note",
  })
  complete(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() input: CompleteEventDto,
  ) {
    return this.events.complete(user.id, id, input);
  }

  @Patch(":id/schedule")
  @ApiOperation({
    summary: "Move an owned unfinished exercise to today or later",
  })
  move(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() input: MoveEventDto,
  ) {
    return this.events.move(user.id, id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an owned exercise with an undo token" })
  remove(@User() user: Identity, @Param("id") id: string) {
    return this.events.discard(user.id, id, "delete");
  }

  @Post(":id/reopen")
  @ApiOperation({
    summary: "Clear completion, rating and note with an undo token",
  })
  reopen(@User() user: Identity, @Param("id") id: string) {
    return this.events.discard(user.id, id, "reopen");
  }

  @Post(":id/undo")
  @ApiOperation({ summary: "Undo deletion or reopening of an owned exercise" })
  undo(
    @User() user: Identity,
    @Param("id") id: string,
    @Body() input: UndoEventDto,
  ) {
    return this.events.undo(user.id, id, input.token);
  }
}
