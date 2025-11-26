import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsMongoId,
  ArrayUnique,
  ArrayMinSize, // Potentially useful for min items in array, though not explicitly used here
  IsDate,
  IsNumber,
  Min,
  ValidateNested, // New: For nested DTOs
  ValidateIf,
  IsUrl, // For URL validation in social links
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer'; // New: Type for nested DTOs
import {
  EventType,
  EventStatus,
  Currency,
  EventFormat,
  Timezone,
} from 'src/enums';

// DTO for Location Details (for nested validation)
export class LocationDetailsDto {
  @ApiProperty({
    example: 'Javits Center',
    description: 'The name of the location.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '655 W 34th St, New York, NY 10001',
    description: 'The full address of the location.',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}

// DTO for Social Link (for nested validation)
export class SocialLinkDto {
  @ApiProperty({
    example: 'Facebook',
    description: 'The platform name (e.g., Facebook, Twitter, LinkedIn).',
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    example: 'https://www.facebook.com/yourevent',
    description: 'The URL of the social media page.',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class CreateEventDto {
  @ApiProperty({
    example: 'Annual Tech Conference 2025',
    description: 'The title of the event.',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'A gathering of tech enthusiasts and industry leaders.',
    description: 'A detailed description of the event.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: EventType.CONFERENCE,
    description: 'The type of event.',
    enum: EventType,
  })
  @IsEnum(EventType)
  type: string;

  // --- NEW FIELD: Event Format ---
  @ApiProperty({
    example: EventFormat.IN_PERSON,
    description: 'The format of the event (e.g., Online, In-person, Hybrid).',
    enum: EventFormat,
  })
  @IsEnum(EventFormat)
  format: string;

  @ApiProperty({
    example: EventStatus.DRAFT,
    description: 'The current status of the event.',
    enum: EventStatus,
    default: EventStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status: string;

  @ApiProperty({
    example: '2025-10-26T09:00:00Z',
    description: 'The start date and time of the event (ISO 8601 format).',
  })
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  startDate: Date;

  @ApiProperty({
    example: '2025-10-28T17:00:00Z',
    description: 'The end date and time of the event (ISO 8601 format).',
  })
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  endDate: Date;

  @ApiProperty({
    example: Timezone.UTC,
    description: 'The timezone of the event (IANA Time Zone Database name).',
    enum: Timezone,
    required: false,
  })
  @IsEnum(Timezone)
  timezone: string;

  @ApiProperty({
    example: '655 W 34th St, New York, NY 10001',
    description: 'The full address of the location.',
    required: false,
  })
  @IsOptional()
  @IsString()
  adresse: string;

  @ApiProperty({
    example: '655 W 34th St, New York, NY 10001',
    description: 'The full address of the location.',
    required: false,
  })
  @IsOptional()
  @IsString()
  avenue: string;

  @ApiProperty({
    example: 'https://zoom.us/j/1234567890',
    description: 'The virtual URL for online events.',
    required: false,
  })
  @IsOptional()
  @IsString()
  virtualUrl?: string;

  // --- NEW FIELD: Number of Participants ---
  @ApiProperty({
    example: 500,
    description:
      'Optional: The estimated or actual number of participants for the event.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfParticipants?: number;

  @ApiProperty({
    example: Currency.USD,
    description:
      'The primary currency for the event (e.g., for pricing, tariffs).',
    enum: Currency,
  })
  @IsEnum(Currency)
  currency: string;

  @ApiProperty({
    type: [String],
    example: ['60d5ec49f8a3c5a6d8b4567f', '60d5ec49f8a3c5a6d8b4567a'],
    description:
      'Optional: Array of MongoDB ObjectIds referencing required documents for the event.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  requiredDocumentIds?: string[];

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
    type: [String],
    example: ['60d5ec49f8a3c5a6d8b45671', '60d5ec49f8a3c5a6d8b45672'],
    description:
      'Required if the event is not free (isFree: false). Array of MongoDB ObjectIds referencing tariff rules.',
    isArray: true,
    required: false, // Conditionally required, so Swagger shows it as optional.
  })
  @ValidateIf((o) => o.isFree === false)
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  @ArrayMinSize(1, {
    message: 'At least one tariff rule ID must be provided for paid events.',
  })
  @IsNotEmpty({ message: 'Tariff rules cannot be empty for paid events.' })
  tariffRuleIds?: string[];

  @ApiProperty({
    type: [String],
    example: ['60d5ec49f8a3c5a6d8b45673', '60d5ec49f8a3c5a6d8b45674'],
    description:
      'Optional: Array of MongoDB ObjectIds referencing partners associated with the event.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  partnerIds?: string[];

  @ApiProperty({
    type: [String],
    example: ['60d5ec49f8a3c5a6d8b45673', '60d5ec49f8a3c5a6d8b45674'],
    description:
      'Optional: Array of MongoDB ObjectIds referencing partners associated with the event.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()
  eventScheduleIds?: string[];

  // --- NEW FIELD: Social Links ---
  @ApiProperty({
    type: [SocialLinkDto], // Referencing the new DTO
    example: [
      { platform: 'Facebook', url: 'https://www.facebook.com/yourevent' },
      { platform: 'Twitter', url: 'https://twitter.com/yourevent' },
    ],
    description: 'Optional: An array of social media links for the event.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validates each item in the array against SocialLinkDto rules
  @Type(() => SocialLinkDto) // Tells class-transformer how to instantiate objects in the array
  socialLinks?: SocialLinkDto[];

  @ApiProperty({
    example: true,
    description: 'Whether the event is publicly visible.',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic: boolean = false;

  @ApiProperty({
    example: false,
    description: 'Whether the event is free of charge.',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
