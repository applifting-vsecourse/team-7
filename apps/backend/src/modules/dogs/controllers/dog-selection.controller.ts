import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
import { User } from "@/shared/auth/decorators/user.decorator";
import { Identity } from "@/shared/auth/domain/identity";
import { AuthenticatedUserGuard } from "@/shared/auth/guards/authenticated-user.guard";
import {
  DogDisciplineSelectionDto,
  DogExerciseInputDto,
  DogExerciseSelectionDto,
  DogGoalProgressDto,
  DogGoalSelectionDto,
} from "./dto/dog-selection.dto";

type SelectionParams = {
  dogId: string;
  disciplineId: string;
  goalId: string;
  exerciseId: string;
};

@ApiTags("dog selections")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Authentication required" })
@ApiNotFoundResponse({ description: "Dog, discipline or assignment not found" })
@ApiBadRequestResponse({
  description: "Invalid selection or goal/exercise relationship",
})
@ApiConflictResponse({
  description: "Assignment exists or concurrent selection conflict",
})
@Controller("dogs/:dogId/disciplines/:disciplineId")
@UseGuards(AuthenticatedUserGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class DogSelectionController {
  constructor(private readonly selections: DogSelectionService) {}

  @Get("selection")
  @ApiOperation({
    summary: "Get the dog's selected goals and exercises in a discipline",
  })
  getSelection(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, async (tx) => ({
      goals: await this.selections.list(tx, scope),
    }));
  }

  @Put("selection")
  @ApiOperation({
    summary:
      "Replace the complete selection in this discipline; empty goals clears it",
  })
  replaceSelection(
    @User() user: Identity,
    @Param() params: SelectionParams,
    @Body() body: DogDisciplineSelectionDto,
  ) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.replace(tx, scope, body.goals),
    );
  }

  @Get("goals")
  @ApiOperation({ summary: "List this dog's goals in the discipline" })
  getGoals(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) => this.selections.list(tx, scope));
  }

  @Post("goals")
  @ApiOperation({
    summary:
      "Assign an existing library goal and selected exercises to this dog",
  })
  addGoal(
    @User() user: Identity,
    @Param() params: SelectionParams,
    @Body() body: DogGoalSelectionDto,
  ) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.addGoal(tx, scope, body),
    );
  }

  @Get("goals/:goalId")
  @ApiOperation({
    summary: "Get a dog goal assignment with its selected exercises",
  })
  getGoal(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.getGoal(tx, scope, params.goalId),
    );
  }

  @Put("goals/:goalId")
  @ApiOperation({
    summary:
      "Assign a goal or replace its selected exercises, preserving completion",
  })
  replaceGoal(
    @User() user: Identity,
    @Param() params: SelectionParams,
    @Body() body: DogExerciseSelectionDto,
  ) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.replaceGoal(tx, scope, {
        goalId: params.goalId,
        exerciseIds: body.exerciseIds,
      }),
    );
  }

  @Patch("goals/:goalId")
  @ApiOperation({ summary: "Mark the dog's goal completed or reopen it" })
  completeGoal(
    @User() user: Identity,
    @Param() params: SelectionParams,
    @Body() body: DogGoalProgressDto,
  ) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.completeGoal(tx, scope, params.goalId, body.completed),
    );
  }

  @Delete("goals/:goalId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove the dog's goal and its exercise assignments",
  })
  @ApiNoContentResponse({ description: "Goal assignment removed" })
  removeGoal(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.removeGoal(tx, scope, params.goalId),
    );
  }

  @Get("goals/:goalId/exercises")
  @ApiOperation({ summary: "List the dog's selected exercises for a goal" })
  getExercises(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(
      scope,
      async (tx) =>
        (await this.selections.getGoal(tx, scope, params.goalId)).exercises,
    );
  }

  @Post("goals/:goalId/exercises")
  @ApiOperation({
    summary:
      "Assign an existing library exercise; repeated assignments have no effect",
  })
  addExercise(
    @User() user: Identity,
    @Param() params: SelectionParams,
    @Body() body: DogExerciseInputDto,
  ) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.addExercise(tx, scope, params.goalId, body.exerciseId),
    );
  }

  @Get("goals/:goalId/exercises/:exerciseId")
  @ApiOperation({ summary: "Get a dog exercise assignment" })
  getExercise(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.getExercise(tx, scope, params.goalId, params.exerciseId),
    );
  }

  @Delete("goals/:goalId/exercises/:exerciseId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove the exercise assignment, keeping the dog's goal",
  })
  @ApiNoContentResponse({ description: "Exercise assignment removed" })
  removeExercise(@User() user: Identity, @Param() params: SelectionParams) {
    const scope = { ...params, userId: user.id };
    return this.selections.run(scope, (tx) =>
      this.selections.removeExercise(
        tx,
        scope,
        params.goalId,
        params.exerciseId,
      ),
    );
  }
}
