import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId, // Keep for now, but see note below regarding eventId
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer'; // Make sure Type is imported
import { ApiProperty } from '@nestjs/swagger';
import { ActualityType } from '../../enums';

/**
 * DTO pour la création d'une nouvelle actualité.
 * Les champs 'tenantId', 'createdBy', 'updatedBy' sont gérés par le backend.
 */
export class CreateActualityDto {
  @ApiProperty({
    description: "Le titre de l'actualité",
    example: "Nouvelle Conférence sur l'Intelligence Artificielle",
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Le titre est obligatoire.' })
  @IsString({ message: 'Le titre doit être une chaîne de caractères.' })
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères.' })
  @MaxLength(100, { message: 'Le titre ne peut pas dépasser 100 caractères.' })
  title: string;

  @ApiProperty({
    description: "Le contenu détaillé de l'actualité",
    example:
      "Nous sommes ravis d'annoncer notre conférence annuelle sur l'intelligence artificielle...",
    required: false,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: 'Le contenu doit être une chaîne de caractères.' })
  @MaxLength(5000, {
    message: 'Le contenu ne peut pas dépasser 5000 caractères.',
  })
  content?: string;

  @ApiProperty({
    description:
      "Type d'actualité (par exemple, NOUVELLE, ANNONCE, MISE_À_JOUR, ARTICLE_BLOG, COMMUNIQUÉ_PRESSE)",
    enum: ActualityType,
    example: ActualityType.ANNOUNCEMENT,
  })
  @IsNotEmpty({ message: "Le type d'actualité est obligatoire." })
  @IsEnum(ActualityType, { message: "Type d'actualité invalide." })
  type: ActualityType;

  @ApiProperty({
    description:
      "Date et heure de publication de l'actualité (format ISO 8601)",
    example: '2025-07-15T10:00:00Z',
    type: String, // Keep as String for API documentation as it's string in JSON input
  })
  @IsNotEmpty({ message: 'La date de publication est obligatoire.' })
  // This Transform handles ISO string to Date object conversion for 'publishedAt'
  @Transform(({ value }) => (value ? new Date(value) : new Date()), {
    toClassOnly: true,
  })
  @IsDate({
    message: 'La date de publication doit être une date ISO 8601 valide.',
  })
  @Type(() => Date) // Ensure it's typed as Date for validation to work correctly
  publishedAt: Date;

  @ApiProperty({
    description: "Indique si l'actualité est active et visible",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive doit être un booléen.' })
  @Type(() => Boolean) // <--- ADD THIS LINE HERE
  isActive?: boolean;

  @ApiProperty({
    description: "URL de l'image miniature de l'actualité",
    example: 'https://minio.exemple.com/vignettes/actu-conf-ia.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'URL de l'image doit être une chaîne de caractères." })
  imageUrl?: string;

  @ApiProperty({
    description: "Liste des URLs des pièces jointes associées à l'actualité",
    type: [String],
    example: [
      'https://minio.exemple.com/pieces-jointes/doc1.pdf',
      'https://minio.exemple.com/pieces-jointes/doc2.pdf',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Les pièces jointes doivent être un tableau.' })
  @IsString({
    each: true,
    message: 'Chaque URL de pièce jointe doit être une chaîne de caractères.',
  })
  attachments?: string[];

  @ApiProperty({
    description: "ID de l'événement lié à cette actualité (facultatif)",
    example: '60d5ec49f8a3c5a6d8b4567c',
    required: false,
  })
  @IsOptional()
  // @IsMongoId({ message: 'L\'ID de l\'événement doit être un ObjectId MongoDB valide.' }) // See important note below
  @IsString({
    message: "L'ID de l'événement doit être une chaîne de caractères.",
  }) // <--- Potentially change to this
  eventId?: string;

  @ApiProperty({
    description:
      "Lien externe pour plus d'informations sur l'actualité (facultatif)",
    example: 'https://blog.exemple.com/nouvelle-conference-ia',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le lien externe doit être une chaîne de caractères.' })
  externalLink?: string;
}
