// src/speaker/dto/filter-speaker.dto.ts
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
import { Types } from 'mongoose'; // Types est bien utilisé ici pour le typecast interne, mais DTOs reçoivent des string pour les IDs
import { SpeakerType } from 'src/enums';

export class FilterSpeakerDto {
  @ApiProperty({
    description: "Filtrer par l'identifiant du locataire.",
    required: false,
    example: '60c72b2f9b1d8f001c8e4d8a',
    type: String, // Spécifié comme String car l'API reçoit un string
  })
  @IsOptional()
  @IsMongoId()
  tenantId?: Types.ObjectId; // Si reçu comme string, il faudrait le typer comme `string` ici

  @ApiProperty({
    description:
      'Rechercher par nom de conférencier (correspondance partielle).',
    required: false,
    example: 'jean', // 'john' -> 'jean'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Rechercher par nom d'entreprise (correspondance partielle).",
    required: false,
    example: 'tech',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description:
      'Le type de conférencier (par exemple, VIP, modérateur, invité).',
    required: false,
    enum: SpeakerType,
    example: SpeakerType.VIP,
  })
  @IsOptional()
  @IsEnum(SpeakerType)
  speakerType?: SpeakerType;

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
