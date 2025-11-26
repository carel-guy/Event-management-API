import {
  IsOptional,
  IsString,
  IsEmail,
  IsNumberString,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  // Add other roles as needed
}

export class FilterUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by user name (first or last)',
    type: String,
  })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Filter by user email', type: String })
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole,
    enumName: 'UserRole',
  })
  role?: UserRole;

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
