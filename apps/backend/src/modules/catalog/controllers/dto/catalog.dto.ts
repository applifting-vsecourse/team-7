import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import {
  CATALOG_LANGUAGES,
  type CatalogLanguage,
} from "@/shared/domain/discipline-catalog";

export class CatalogLanguageDto {
  @ApiPropertyOptional({ enum: CATALOG_LANGUAGES, default: "cs" })
  @IsOptional()
  @IsIn(CATALOG_LANGUAGES)
  lng: CatalogLanguage = "cs";
}

export class CatalogCopyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: "False when the library already had a copy" })
  created!: boolean;
}
