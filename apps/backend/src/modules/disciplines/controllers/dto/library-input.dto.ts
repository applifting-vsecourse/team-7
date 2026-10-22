import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

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
