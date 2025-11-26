// src/event/dto/filter-event.dto.ts
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EventType, EventStatus, Currency, EventFormat } from 'src/enums';

export class FilterEventDto {
  // REMOVED: tenantId from DTO for security and to ensure tenantId comes from authenticated context
  @ApiProperty({
    description: 'The ID of the tenant to filter events by.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description:
      'General search term for event title, description, or location names/addresses (case-insensitive).',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string; // New search field

  @ApiProperty({
    description: 'Filter by partial or full event title (case-insensitive).',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Filter by event type.',
    enum: EventType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiProperty({
    description: 'Filter by event format (e.g., Online, In-person, Hybrid).',
    enum: EventFormat,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventFormat)
  format?: EventFormat; // New filter

  @ApiProperty({
    description: 'Filter by event status.',
    enum: EventStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({
    description:
      'Filter for events starting on or after this date (ISO 8601 string).',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  startDateFrom?: Date;

  @ApiProperty({
    description:
      'Filter for events ending on or before this date (ISO 8601 string).',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  endDateTo?: Date;

  @ApiProperty({
    description:
      'Filter by partial or full location name or address (case-insensitive, searches within locations array).',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Filter by event currency.',
    enum: Currency,
    required: false,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    description: 'Filter for events with at least this many participants.',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minParticipants?: number; // New filter

  @ApiProperty({
    description: 'Filter for events with at most this many participants.',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxParticipants?: number; // New filter

  @ApiProperty({ description: 'Filter by public status.', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiProperty({
    description: 'Page number for pagination (starts from 1).',
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
    description: 'Number of items per page.',
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
