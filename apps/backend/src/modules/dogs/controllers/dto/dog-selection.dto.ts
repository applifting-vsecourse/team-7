import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

export class DogExerciseSelectionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  exerciseIds!: string[];
}

export class DogGoalSelectionDto extends DogExerciseSelectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  goalId!: string;
}

export class DogDisciplineSelectionDto {
  @ApiProperty({ type: [DogGoalSelectionDto] })
  @IsArray()
  @ArrayUnique((goal: DogGoalSelectionDto) => goal.goalId)
  @ValidateNested({ each: true })
  @Type(() => DogGoalSelectionDto)
  goals!: DogGoalSelectionDto[];
}

export class DogGoalProgressDto {
  @ApiProperty()
  @IsBoolean()
  completed!: boolean;
}

export class DogExerciseInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;
}
