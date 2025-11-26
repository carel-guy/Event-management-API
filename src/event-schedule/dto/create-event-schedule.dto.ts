// src/event-schedule/dto/create-event-schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsString,
  IsDate,
  IsOptional,
  IsNotEmpty,
  ArrayMinSize,
  ArrayUnique,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
// import { Prop } from '@nestjs/mongoose'; // This import is not needed in DTOs
import { SessionType } from 'src/enums'; // Use SessionType from schema

export class CreateEventScheduleDto {
  @ApiProperty({
    description:
      "L'identifiant de l'événement auquel cet élément de programme est associé.",
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @IsMongoId()
  eventId: Types.ObjectId;

  @ApiProperty({
    description:
      'Le titre de l\'élément de programme (par exemple, "Discours d\'ouverture", "Pause déjeuner").',
    example: "Cérémonie d'ouverture",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Une brève description de l'élément de programme.",
    required: false,
    example: "Remarques de bienvenue et présentation de l'événement.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Le type de session de l\'élément de programme (par exemple, "Session", "Pause", "Réseautage").',
    enum: SessionType, // Utilisation de SessionType
    example: SessionType.NETWORKING, // Exemple basé sur SessionType
  })
  @IsEnum(SessionType)
  sessionType: SessionType; // Changé de 'type' à 'sessionType'

  @ApiProperty({
    description:
      "L'heure de début de l'élément de programme (format ISO 8601).",
    example: '2025-07-05T09:00:00.000Z', // Exemple mis à jour pour la date actuelle
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({
    description: "L'heure de fin de l'élément de programme (format ISO 8601).",
    example: '2025-07-05T10:00:00.000Z', // Exemple mis à jour
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({
    description:
      'L\'emplacement où se déroule l\'élément de programme (par exemple, "Hall principal", "Salle 301").',
    required: false,
    example: 'Grande Salle de Bal',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description:
      "Un tableau d'identifiants des conférenciers participant à cet élément de programme.",
    type: [String],
    required: false,
    example: ['60c72b2f9b1d8f001c8e4d8f', '60c72b2f9b1d8f001c8e4d90'],
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayUnique()
  // @ArrayMinSize(0) // Generally not needed for optional arrays, as empty array is fine
  @Type(() => Types.ObjectId)
  speakers?: Types.ObjectId[];

  @ApiProperty({
    description:
      "L'identifiant de la référence de fichier image associée à cet élément de programme.",
    required: false,
    example:
      'http://192.168.40.41:9000/waangu-event/60d5ec49f8a3c5a6d8b4567f/29ad73fa-eb9c-4179-a44b-85e411411c78.jpg',
  })
  @IsString()
  @IsOptional()
  imageFileReferenceId?: string;

  // Note: 'attendees' field is not in your EventSchedule schema, so I'm removing it.
  // If it's needed, it should be added to the schema first.

  // Note: 'type' was renamed to 'sessionType' in your schema, so I've updated it.
}
