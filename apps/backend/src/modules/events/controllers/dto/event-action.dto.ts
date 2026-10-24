import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CompleteEventDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
export class MoveEventDto {
  @ApiProperty({ format: "date-time" })
  @IsDateString({ strict: true })
  startsAt!: string;

  @ApiProperty({ minimum: 1, maximum: 1440 })
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;

  @ApiProperty({ example: "Europe/Prague" })
  @IsTimeZone()
  timeZone!: string;
}
export class UndoEventDto {
  @ApiProperty()
  @IsUUID()
  token!: string;
}
