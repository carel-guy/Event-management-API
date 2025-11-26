// src/speaker/dto/create-speaker.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsMongoId,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ArrayUnique,
  IsEmail,
} from 'class-validator';
import { Types } from 'mongoose'; // Types est bien utilisé ici pour le typecast interne, mais DTOs reçoivent des string pour les IDs
import { SpeakerType } from 'src/enums';

export class CreateSpeakerDto {
  @ApiProperty({
    description:
      'Le nom complet du conférencier (doit être unique par locataire).',
    example: 'Jean Dupont', // John Doe
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The email address of the speaker.',
    example: 'speaker@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Une brève biographie du conférencier.',
    required: false,
    example:
      'Ingénieur logiciel expérimenté passionné par les technologies cloud.', // Experienced software engineer with a passion for cloud technologies.
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: "L'entreprise à laquelle le conférencier est affilié.",
    required: false,
    example: 'Solutions Tech Inc.', // Tech Solutions Inc.
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'URL du profil LinkedIn du conférencier.',
    required: false,
    example: 'https://www.linkedin.com/in/jeandupont', // https://www.linkedin.com/in/johndoe
  })
  @IsOptional()
  @IsString()
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
  profilePictureId?: string;

  @ApiProperty({
    description:
      'Le type de conférencier (par exemple, VIP, modérateur, invité).',
    required: false,
    enum: SpeakerType,
    example: SpeakerType.VIP,
  })
  @IsOptional()
  @IsEnum(SpeakerType)
  speakerType?: SpeakerType;
}
