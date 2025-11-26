import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ActualityType } from 'src/enums';

export class FilterActualityDto {
  @ApiPropertyOptional({ example: '64e761982bdb2ac1f0d3e245' })
  @IsMongoId()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: '64e761982bdb2ac1f0d3e111' })
  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ example: 'NEWS', enum: ActualityType })
  @IsEnum(ActualityType)
  @IsOptional()
  type?: ActualityType;

  @ApiPropertyOptional({ example: '2024-10-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  publishedAt?: Date;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  limit?: number;
}
