// src/event-config/dto/filter-event-config.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsOptional,
  IsBooleanString,
  IsNumber,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class FilterEventConfigDto {
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
    description:
      "Filtrer par le statut d'inscription (vrai ou faux sous forme de chaîne de caractères).",
    required: false,
    example: 'true',
    type: 'boolean',
  })
  @IsOptional()
  @IsBooleanString()
  isRegistrationOpen?: string; // Utiliser une chaîne de caractères pour les paramètres de requête booléens

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
