import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export const NAME_MAX_LENGTH = 100;
export const TEXT_MAX_LENGTH = 1000;

const nonblank = { message: "name must contain a non-whitespace character" };

export class DisciplineInputDto {
  @ApiProperty({ example: "Agility", maxLength: NAME_MAX_LENGTH })
  @IsString()
  @Matches(/\S/, nonblank)
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    example: "Překážky, slalom a vedení na dálku.",
    maxLength: TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  description?: string;
}

export class GoalInputDto {
  @ApiProperty({
    example: "Slalom 12 tyček bez chyby",
    maxLength: NAME_MAX_LENGTH,
  })
  @IsString()
  @Matches(/\S/, nonblank)
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    example: "3 průchody bez chyby za sebou na dvou různých trénincích.",
    description: "When the goal counts as achieved",
    maxLength: TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  criterion?: string;
}

export class ExerciseInputDto {
  @ApiProperty({ example: "Přivolání od hračky", maxLength: NAME_MAX_LENGTH })
  @IsString()
  @Matches(/\S/, nonblank)
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    example: "Pes si hraje s hračkou, přivolat ve chvíli nejvyšší hry.",
    maxLength: TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  procedure?: string;
}

// Far above any real goal; bounds the work validation does on a request.
export const EXERCISE_ORDER_MAX_SIZE = 500;
const ID_MAX_LENGTH = 100;

export class ExerciseOrderDto {
  @ApiProperty({
    type: [String],
    description: "Every exercise of the goal, in the new order",
    maxItems: EXERCISE_ORDER_MAX_SIZE,
  })
  @IsArray()
  @ArrayMaxSize(EXERCISE_ORDER_MAX_SIZE)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(ID_MAX_LENGTH, { each: true })
  exerciseIds!: string[];
}
