import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { OnboardingStatus } from "@/generated/prisma/client";
import { DogDisciplineSelectionDto } from "@/modules/dogs/controllers/dto/dog-selection.dto";
import {
  CATALOG_LANGUAGES,
  type CatalogLanguage,
} from "@/modules/onboarding/domain/discipline-catalog";

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

export class CatalogQueryDto {
  @ApiProperty({ enum: CATALOG_LANGUAGES })
  @IsIn(CATALOG_LANGUAGES)
  lng!: CatalogLanguage;
}

export class CatalogCopyDto extends DogDisciplineSelectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dogId!: string;

  @ApiProperty({ enum: CATALOG_LANGUAGES })
  @IsIn(CATALOG_LANGUAGES)
  lng!: CatalogLanguage;
}
