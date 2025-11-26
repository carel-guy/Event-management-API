// src/event-schedule/dto/update-event-schedule.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventScheduleDto } from './create-event-schedule.dto';
import {
  IsOptional,
  IsString,
  IsDate,
  IsNotEmpty,
  ArrayUnique,
  IsMongoId,
  IsEnum,
} from 'class-validator'; // Add IsEnum
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer'; // Add Transform
import { SessionType } from 'src/enums'; // Import SessionType

export class UpdateEventScheduleDto extends PartialType(
  CreateEventScheduleDto,
) {
  @ApiProperty({
    description: "Le titre mis à jour de l'élément de programme.",
    example: "Discours d'ouverture (Mis à jour)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Keep IsNotEmpty if an empty string is not allowed for an updated title
  title?: string;

  @ApiProperty({
    description: "Une description mise à jour de l'élément de programme.",
    required: false,
    example:
      'Description mise à jour : Un accueil révisé et des informations clés.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // --- NEW FIELD: Session Type ---
  @ApiProperty({
    description: "Le type de session mis à jour de l'élément de programme.",
    enum: SessionType,
    example: SessionType.NETWORKING, // Exemple mis à jour
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType; // Changé de 'type' à 'sessionType'

  @ApiProperty({
    description:
      "L'heure de début mise à jour de l'élément de programme (format ISO 8601).",
    example: '2025-07-05T09:15:00.000Z', // Exemple mis à jour
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  startTime?: Date;

  @ApiProperty({
    description:
      "L'heure de fin mise à jour de l'élément de programme (format ISO 8601).",
    example: '2025-07-05T10:15:00.000Z', // Exemple mis à jour
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  endTime?: Date;

  @ApiProperty({
    description:
      "L'emplacement mis à jour où se déroule l'élément de programme.",
    required: false,
    example: 'Auditorium 1',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description:
      "Un tableau mis à jour d'identifiants de conférenciers participant à cet élément de programme.",
    type: [String],
    required: false,
    example: ['60c72b2f9b1d8f001c8e4d8f'],
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayUnique()
  // @ArrayMinSize(0) // Generally not needed for optional arrays
  @Type(() => Types.ObjectId)
  speakers?: Types.ObjectId[];

  // @ApiProperty({
  //       description: "L'identifiant de la référence de fichier image associée à cet élément de programme.",
  //       required: false,
  //       example: '60c72b2f9b1d8f001c8e4d91',
  //   })
  //   @IsOptional()
  //   @IsMongoId()
  //   imageFileReferenceId?: Types.ObjectId;
}
