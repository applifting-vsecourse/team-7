import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class EmailChangeIdDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-f0-9]{32}$/)
  id!: string;
}

export class PendingEmailChangeDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() expiresAt!: Date;
}

export class PendingEmailChangeResponseDto {
  @ApiProperty({ type: PendingEmailChangeDto, nullable: true })
  pendingEmailChange!: PendingEmailChangeDto | null;
}
