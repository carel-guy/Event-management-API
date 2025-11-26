// src/event-config/dto/create-event-config.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsDate,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateEventConfigDto {
  @ApiProperty({
    description:
      "L'identifiant de l'événement auquel cette configuration s'applique (doit être unique).",
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @IsMongoId()
  eventId: Types.ObjectId;

  @ApiProperty({
    description:
      "Indique si les inscriptions pour l'événement sont actuellement ouvertes.",
    example: true,
    default: false,
  })
  @IsBoolean()
  isRegistrationOpen: boolean;

  @ApiProperty({
    description: "Le nombre maximum de participants autorisé pour l'événement.",
    required: false,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @ApiProperty({
    description:
      "La date de début des inscriptions à l'événement (format ISO 8601).",
    required: false,
    example: '2025-07-01T09:00:00.000Z', // Assuming current date from context: July 5, 2025
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationStartDate?: Date;

  @ApiProperty({
    description:
      "La date de fin des inscriptions à l'événement (format ISO 8601).",
    required: false,
    example: '2025-07-31T17:00:00.000Z', // Example end date in July
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationEndDate?: Date;
}
