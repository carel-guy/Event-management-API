import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsOptional, IsPositive } from 'class-validator';

export class GetEventsByUserIdDto {
  @ApiProperty({
    example: '60d5ec49f8a3c5a6d8b4567e',
    description:
      'The ID of the user to filter events by (createdBy or updatedBy)',
    required: true,
  })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;
}
