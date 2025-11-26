import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEventAssetDto } from './create-event-asset.dto';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { AssetCategory } from 'src/enums'; // Importez le nouvel enum

export class UpdateEventAssetDto extends PartialType(CreateEventAssetDto) {
  @ApiProperty({
    description: "Le nom mis à jour de l'actif de l'événement.",
    example: 'Projecteur (Mis à jour)', // Projector (Updated)
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Une brève description mise à jour de l'actif de l'événement.",
    required: false,
    example: 'Description mise à jour : Projecteur haute résolution.', // Updated description: High-resolution projector.
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      "La quantité mise à jour d'actifs disponibles pour l'événement.",
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({
    description: "La catégorie mise à jour de l'actif de l'événement.",
    enum: AssetCategory,
    required: false,
    example: AssetCategory.SERVICES, // SERVICES
  })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;
}
