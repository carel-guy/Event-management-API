// src/event-config/dto/update-event-config.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventConfigDto } from './create-event-config.dto';
import { IsBoolean, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventConfigDto extends PartialType(CreateEventConfigDto) {
  @ApiProperty({
    description:
      "Indique si les inscriptions pour l'événement sont actuellement ouvertes.",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRegistrationOpen?: boolean;

  @ApiProperty({
    description: "Le nombre maximum de participants autorisé pour l'événement.",
    required: false,
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @ApiProperty({
    description:
      "La date de début des inscriptions à l'événement (format ISO 8601).",
    required: false,
    example: '2025-07-05T10:00:00.000Z', // Assuming current date from context: July 5, 2025
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
    example: '2025-08-15T18:00:00.000Z', // Example end date in August
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationEndDate?: Date;
}
