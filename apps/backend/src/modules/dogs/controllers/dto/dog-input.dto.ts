import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class DogInputDto {
  @ApiProperty({ example: "Buddy", description: "Nonblank dog text" })
  @IsString()
  @Matches(/\S/, { message: "text must contain a non-whitespace character" })
  text!: string;
}
