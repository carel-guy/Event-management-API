import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsMongoId,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
// import { Types } from 'mongoose'; // Non directement utilisé pour les propriétés du DTO

export class FilterPartnerDto {
  @ApiProperty({
    description: "Filtrer les partenaires par l'identifiant du locataire.",
    required: false,
    example: '60c72b2f9b1d8f001c8e4d8a',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  tenantId?: string; // Type string car les paramètres de filtre sont généralement des chaînes de caractères

  @ApiProperty({
    description:
      'Filtrer les partenaires par nom (correspondance partielle insensible à la casse).',
    required: false,
    example: 'Tech',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filtrer les partenaires par catégorie.',
    required: false,
    example: 'Sponsor',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Numéro de page pour la pagination.',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page pour la pagination.",
    required: false,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
