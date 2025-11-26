import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { AssetCategory } from 'src/enums'; // Importez le nouvel enum

export class FilterEventAssetDto {
  @ApiProperty({
    description: "Filtrer par l'identifiant du locataire.",
    required: false,
    example: '60c72b2f9b1d8f001c8e4d8a',
  })
  @IsOptional()
  @IsMongoId()
  tenantId?: Types.ObjectId;

  @ApiProperty({
    description: "Filtrer par l'identifiant de l'événement.",
    required: false,
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @IsOptional()
  @IsMongoId()
  eventId?: Types.ObjectId;

  @ApiProperty({
    description: "Rechercher par le nom de l'actif (correspondance partielle).",
    required: false,
    example: 'proj', // 'proj' as in 'projecteur'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Filtrer par la catégorie de l'actif.",
    enum: AssetCategory,
    required: false,
    example: AssetCategory.EQUIPMENT, // ÉQUIPEMENT
  })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory; // Nouveau paramètre de filtre

  @ApiProperty({
    example: 1,
    description: 'Numéro de page pour la pagination (commence à 1).',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: "Nombre d'éléments par page.",
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
