import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'The name of the tenant.',
    example: 'Awesome Events Inc.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
