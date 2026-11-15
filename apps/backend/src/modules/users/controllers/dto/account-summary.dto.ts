import { ApiProperty } from "@nestjs/swagger";

export class AccountSummaryDto {
  @ApiProperty() dogs!: number;
  @ApiProperty() disciplines!: number;
  @ApiProperty() exercises!: number;
  @ApiProperty() videos!: number;
}
