import { PartialType } from '@nestjs/mapped-types';
import {
  CreateEventDto,
  LocationDetailsDto, // Import the nested DTO
  SocialLinkDto, // Import the nested DTO
} from './create-event.dto'; // Assuming these are in the same file or accessible path
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsMongoId,
  ArrayUnique,
  IsDate,
  IsNumber,
  Min,
  ValidateNested, // New: For nested DTOs
  IsUrl, // For URL validation in social links
} from 'class-validator';
import { EventType, EventStatus, Currency, EventFormat } from 'src/enums';
import { Type, Transform } from 'class-transformer'; // Import Transform for date conversion

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiProperty({
    example: '2025-10-26T09:00:00Z',
    description:
      'The updated start date and time of the event (ISO 8601 format).',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  startDate?: Date;

  @ApiProperty({
    example: '2025-10-28T17:00:00Z',
    description:
      'The updated end date and time of the event (ISO 8601 format).',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  endDate?: Date;

  // --- NEW FIELD: Event Format ---
  @ApiProperty({
    example: EventFormat.HYBRID,
    description:
      'The updated format of the event (e.g., Online, In-person, Hybrid).',
    enum: EventFormat,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventFormat)
  format?: EventFormat;

  // --- MODIFIED FIELD: Locations as array of objects ---
  @ApiProperty({
    type: [LocationDetailsDto],
    example: [
      { name: 'New Convention Center', address: '123 Event St, City, Country' },
    ],
    description:
      'Optional: An updated array of physical locations for the event, each with a name and address.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDetailsDto)
  locations?: LocationDetailsDto[];

  // --- NEW FIELD: Number of Participants ---
  @ApiProperty({
    example: 750,
    description:
      'Optional: The updated estimated or actual number of participants for the event.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfParticipants?: number;

  // --- NEW FIELD: Image File References ---
  @ApiProperty({
    type: String,
    example:
      'http://192.168.40.41:9000/waangu-event/60d5ec49f8a3c5a6d8b4567f/sample.jpg',
    description: 'Optional: File reference ID or full file URL.',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileReferenceIds?: string;

  @ApiProperty({
    type: [SocialLinkDto],
    example: [
      { platform: 'Instagram', url: 'https://www.instagram.com/yourevent' },
    ],
    description:
      'Optional: An updated array of social media links for the event.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];


}
