// src/event-schedule/dto/filter-speakers-for-event.dto.ts
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // Required for @Type(() => Number)

export class FilterSpeakersForEventDto {
  @ApiProperty({
    description:
      'General search term to filter speakers by name or company (case-insensitive regex match). If provided, it overrides specific name and company filters.',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string; // New search attribute

  @ApiProperty({
    description:
      'Filter speakers by name (case-insensitive regex match). Ignored if "search" is provided.',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description:
      'Filter speakers by company (case-insensitive regex match). Ignored if "search" is provided.',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    example: 1,
    description: 'Page number for pagination (starts at 1).',
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
