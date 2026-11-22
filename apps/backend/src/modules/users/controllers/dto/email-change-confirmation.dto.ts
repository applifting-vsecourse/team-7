import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const CONFIRMATION_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Documents the query; the controller validates it by hand (see there). */
export class EmailChangeConfirmationDto {
  @ApiProperty({ pattern: CONFIRMATION_TOKEN.source })
  token!: string;

  @ApiPropertyOptional({ enum: ["cs", "en"] })
  lng?: "cs" | "en";
}
