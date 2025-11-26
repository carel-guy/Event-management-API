import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpeakerEventDto {
  @IsMongoId()
  @ApiProperty({
    description: 'The ID of the speaker to associate/disassociate.',
    example: '60d5ec49f8a3c5a6d8b4567b',
  })
  speakerId: string;
}
