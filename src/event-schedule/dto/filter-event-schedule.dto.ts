// src/event-schedule/dto/filter-event-schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer'; // Add Transform for dates
import {
  IsMongoId,
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator'; // Use IsDate
import { Types } from 'mongoose';
import { SessionType } from 'src/enums'; // Import SessionType

export class FilterEventScheduleDto {
  @ApiProperty({
    description: "Filtrer par l'identifiant du locataire.",
    required: false,
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description: "Filtrer par l'identifiant de l'événement.",
    required: false,
  })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({
    description: 'Rechercher par le titre (correspondance partielle).',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Rechercher par titre (correspondance partielle).',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  // --- NEW FILTER: Session Type ---
  @ApiProperty({
    description: "Filtrer par le type de session de l'élément de programme.",
    enum: SessionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType; // Ajouté le filtre pour sessionType

  @ApiProperty({
    description:
      'Filtrer les programmes commençant à ou après cette date/heure (format ISO 8601).',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value)) // Transform to Date object
  @IsDate() // Validate as Date object
  startTimeFrom?: Date;

  @ApiProperty({
    description:
      'Filtrer les programmes se terminant à ou avant cette date/heure (format ISO 8601).',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value)) // Transform to Date object
  @IsDate() // Validate as Date object
  endTimeTo?: Date;

  @ApiProperty({
    description: 'Rechercher par emplacement (correspondance partielle).',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description:
      "Filtrer par l'identifiant d'un conférencier spécifique présent dans l'élément de programme.",
    required: false,
  })
  @IsOptional()
  @IsString()
  speakerId?: string;

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
