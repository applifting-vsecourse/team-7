import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UserSettingsDto {
  @ApiProperty({
    example: true,
    description: "Receive daily training reminder emails",
  })
  @IsBoolean()
  emailNotificationsEnabled!: boolean;
}
