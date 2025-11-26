import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class FindReviewsDto {
  @ApiProperty({
    description: 'The ID of the event schedule to find reviews for.',
    example: '60d5ec49f8a3c5a6d8b4567e',
  })
  @IsMongoId()
  @IsNotEmpty()
  eventScheduleId: Types.ObjectId;
}
