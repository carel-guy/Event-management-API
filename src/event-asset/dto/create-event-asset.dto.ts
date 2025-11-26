import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { AssetCategory } from 'src/enums'; // Importez le nouvel enum

export class CreateEventAssetDto {
  @ApiProperty({
    description: "L'identifiant de l'événement auquel l'actif est associé.",
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @IsMongoId()
  eventId: Types.ObjectId;

  @ApiProperty({
    description: "Le nom de l'actif de l'événement.",
    example: 'Projecteur', // Projector
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Une brève description de l'actif de l'événement.",
    required: false,
    example: 'Projecteur LCD haute luminosité pour présentations.', // High-brightness LCD projector for presentations
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "La quantité d'actifs disponibles pour l'événement.",
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: "La catégorie de l'actif de l'événement.",
    enum: AssetCategory, // Utiliser l'enum pour la documentation Swagger
    required: false,
    default: AssetCategory.OTHER,
    example: AssetCategory.MATERIALS, // MATERIALS
  })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;
}
