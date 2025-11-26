import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTenantDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by tenant name', type: String })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by tenant status', type: String })
  status?: string;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: String,
    example: '1',
  })
  page?: string;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({
    description: 'Page size for pagination',
    type: String,
    example: '10',
  })
  limit?: string;
}
