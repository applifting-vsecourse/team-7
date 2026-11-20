import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class EmailChangeConfirmationDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;

  @ApiPropertyOptional({ enum: ["cs", "en"] })
  @IsOptional()
  @IsIn(["cs", "en"])
  lng?: "cs" | "en";
}
