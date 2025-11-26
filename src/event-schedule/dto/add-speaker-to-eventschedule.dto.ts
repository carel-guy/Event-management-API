// src/event-schedule/dto/add-speaker-to-event.dto.ts
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // For Swagger documentation

export class AddSpeakerToEventDto {
  @ApiProperty({
    description:
      'The ID of the event schedule to which the speaker will be added',
    example: '686a59461dc300096bc891b9',
  })
  @IsMongoId({ message: 'eventScheduleId must be a valid MongoId' })
  @IsNotEmpty({ message: 'eventScheduleId is required' })
  eventScheduleId: string;

  @ApiProperty({
    description: 'The ID of the speaker to add to the event schedule',
    example: '68654a4db05aff92275468e7',
  })
  @IsMongoId({ message: 'speakerId must be a valid MongoId' })
  @IsNotEmpty({ message: 'speakerId is required' })
  speakerId: string;
}
