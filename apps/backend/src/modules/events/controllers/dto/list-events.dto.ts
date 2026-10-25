import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class ListEventsDto {
  @ApiProperty({ format: "date-time", description: "Inclusive range start" })
  @IsDateString({ strict: true })
  from!: string;

  @ApiProperty({ format: "date-time", description: "Exclusive range end" })
  @IsDateString({ strict: true })
  to!: string;
}
