import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterReviewDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by event schedule ID',
    example: '60c72b2f9b1d8f001c8e4d8e',
  })
  @IsOptional()
  @IsMongoId()
  eventScheduleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '60d5ec49f8a3c5a6d8b4567e',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
