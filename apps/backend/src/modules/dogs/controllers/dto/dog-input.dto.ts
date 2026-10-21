import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateBy,
} from "class-validator";

export const NAME_MAX_LENGTH = 100;

/**
 * Rejects birth dates after today. Compared against tomorrow in UTC so a
 * handler east of UTC can still enter their local "today".
 */
function IsNotFuture() {
  return ValidateBy({
    name: "isNotFuture",
    validator: {
      validate: (value: unknown) => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return (
          typeof value === "string" &&
          value <= tomorrow.toISOString().slice(0, 10)
        );
      },
      defaultMessage: () => "birthDate must not be in the future",
    },
  });
}

export class DogInputDto {
  @ApiProperty({ example: "Bára", maxLength: NAME_MAX_LENGTH })
  @IsString()
  @Matches(/\S/, { message: "name must contain a non-whitespace character" })
  @MaxLength(NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    example: "Border kolie",
    description: "Free text; blank clears it",
    maxLength: NAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  breed?: string;

  @ApiPropertyOptional({
    example: "2022-05-03",
    description: "Calendar date (YYYY-MM-DD), not in the future",
    nullable: true,
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "birthDate must be a date in YYYY-MM-DD format",
  })
  @IsISO8601({ strict: true })
  @IsNotFuture()
  birthDate?: string | null;
}
