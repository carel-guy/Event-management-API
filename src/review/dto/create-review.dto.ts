// src/review/dto/create-review.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Max,
  Min,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateReviewDto {
  @ApiProperty({
    description: 'The ID of the event schedule being reviewed.',
    example: '60d5ec49f8a3c5a6d8b4567e',
  })
  @IsMongoId()
  @IsNotEmpty()
  eventScheduleId: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'The rating given by the user, from 1 to 5.',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating?: number;

  @ApiProperty({
    description: 'The comment left by the user.',
    example: 'This was a great session!',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({
    description:
      'The ID of the registration for which the review is being submitted.',
    example: '60d5ec49f8a3c5a6d8b4567f',
  })
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ApiPropertyOptional({
    description: 'An array of speaker IDs to tag in the review.',
    type: [String],
    example: ['60d5ec49f8a3c5a6d8b4567c', '60d5ec49f8a3c5a6d8b4567d'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  taggedSpeakers?: Types.ObjectId[];
}
