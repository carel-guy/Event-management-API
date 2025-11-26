import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateReviewParamsDto {
  @ApiProperty({
    description: 'The ID of the review to update.',
    example: '60d5ec49f8a3c5a6d8b4567f',
  })
  @IsMongoId()
  @IsNotEmpty()
  reviewId: Types.ObjectId;
}
