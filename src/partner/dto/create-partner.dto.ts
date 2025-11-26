import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({
    description: 'Le nom du partenaire.',
    example: 'Tech Solutions Inc.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      "L'identifiant de la référence de fichier pour le logo du partenaire.",
    required: false,
    example:
      '/60d5ec49f8a3c5a6d8b4567f/084e1c95-a11d-4233-a43f-741dce5965c6.jpg',
    type: String,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: "L'URL du site web du partenaire.",
    required: false,
    example: 'https://www.techsolutions.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Une brève description du partenaire.',
    required: false,
    example:
      'Fournisseur leader de solutions logicielles innovantes pour la fintech.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
