import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class ScheduledExerciseInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty({ format: "date-time" })
  @IsDateString({ strict: true })
  startsAt!: string;

  @ApiProperty({ minimum: 1, maximum: 1440 })
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;
}
export class ScheduleInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dogId!: string;

  @ApiProperty({ type: [ScheduledExerciseInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ScheduledExerciseInputDto)
  exercises!: ScheduledExerciseInputDto[];
}
