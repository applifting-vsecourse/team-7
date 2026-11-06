import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { DogExerciseStatus, DogGoalStatus } from "@/generated/prisma/client";

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

export class DogGoalStatusDto {
  @ApiProperty({ enum: DogGoalStatus })
  @IsEnum(DogGoalStatus)
  status!: DogGoalStatus;
}

export class DogExerciseStatusDto {
  @ApiProperty({ enum: DogExerciseStatus })
  @IsEnum(DogExerciseStatus)
  status!: DogExerciseStatus;
}

export class DogExerciseInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;
}
