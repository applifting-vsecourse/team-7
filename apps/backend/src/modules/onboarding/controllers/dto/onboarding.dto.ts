import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { OnboardingStatus } from "@/generated/prisma/client";

export class OnboardingQueryDto {
  @ApiProperty({ description: "Start of the handler's current week (ISO)" })
  @IsDateString()
  weekStart!: string;
}

export class OnboardingUpdateDto {
  @ApiPropertyOptional({ enum: OnboardingStatus })
  @IsOptional()
  @IsEnum(OnboardingStatus)
  status?: OnboardingStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  step?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cardHidden?: boolean;
}
