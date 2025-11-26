import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'The ID of the tenant this user belongs to.',
    example: '60d5ec49f8a3c5a6d8b4567f',
  })
  @IsNotEmpty()
  @IsMongoId()
  tenantId: string;

  @ApiProperty({ description: "User's first name.", example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: "User's last name.", example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "User's email address.",
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User's password.", example: 'Str0ngP@ssw0rd' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Roles assigned to the user.',
    enum: UserRole,
    isArray: true,
    example: [UserRole.EVENT_STAFF, UserRole.USER],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
