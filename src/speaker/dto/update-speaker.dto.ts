// src/speaker/dto/update-speaker.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSpeakerDto } from './create-speaker.dto';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  IsEmail,
} from 'class-validator'; // Ajouté IsMongoId
import { SpeakerType } from 'src/enums';

export class UpdateSpeakerDto extends PartialType(CreateSpeakerDto) {
  @ApiProperty({
    description: 'Le nom complet mis à jour du conférencier.',
    example: 'Jean A. Dupont', // John A. Doe
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'The updated email address of the speaker.',
    example: 'speaker.new@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Une biographie courte mise à jour du conférencier.',
    required: false,
    example:
      "Biographie mise à jour : Architecte logiciel senior avec plus de 15 ans d'expérience.", // Updated bio: Senior software architect with 15+ years experience.
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description:
      "L'entreprise mise à jour à laquelle le conférencier est affilié.",
    required: false,
    example: 'Innovations Globales SARL', // Global Innovations LLC
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'URL mise à jour du profil LinkedIn du conférencier.',
    required: false,
    example: 'https://www.linkedin.com/in/jeandupont_misajour', // https://www.linkedin.com/in/johndoe_updated
  })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({
    type: [String],
    example: [
      '60d5ec49f8a3c5a6d8b4567b',
      'http://192.168.40.41:9000/waangu-event/60d5ec49f8a3c5a6d8b4567f/sample.jpg',
    ],
    description: 'Optional: Array of file reference IDs or full file URLs.',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  profilePictureId?: string; // Type string car les DTOs reçoivent des string IDs

  // profilePictureUrl was present in the original UpdateSpeakerDto but not in CreateSpeakerDto.
  // If it's a new field for updates, ensure it's handled in the service/schema.
  // For now, I'm keeping it as it was in your provided DTO.

  @ApiProperty({
    description:
      'Le type de conférencier mis à jour (par exemple, VIP, modérateur, invité).',
    required: false,
    enum: SpeakerType,
    example: SpeakerType.MODERATOR, // Exemple mis à jour pour montrer un changement
  })
  @IsOptional()
  @IsEnum(SpeakerType)
  speakerType?: SpeakerType;
}
