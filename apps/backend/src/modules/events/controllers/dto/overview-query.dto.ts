import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString, IsTimeZone } from "class-validator";

export class OverviewQueryDto {
  @ApiProperty({ example: "Europe/Prague" })
  @IsTimeZone()
  timeZone!: string;

  @ApiPropertyOptional({
    type: String,
    description: "Comma-separated dog IDs; omit for all dogs, empty for none",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? (value === "" ? [] : value.split(",")) : value,
  )
  @IsArray()
  @IsString({ each: true })
  dogIds?: string[];
}
