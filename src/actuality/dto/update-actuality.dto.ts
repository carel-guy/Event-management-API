import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger'; // Importez ApiProperty
import { CreateActualityDto } from './create-actuality.dto';

/**
 * DTO pour la mise à jour d'une actualité existante.
 * Tous les champs sont optionnels pour permettre des mises à jour partielles.
 */
export class UpdateActualityDto extends PartialType(CreateActualityDto) {
  @ApiProperty({
    description: "Le titre de l'actualité",
    example: "Mise à jour Conférence sur l'IA",
    required: false,
  })
  title?: string; // Redéfinir pour ajouter l'exemple si nécessaire, sinon il hérite de CreateActualityDto

  @ApiProperty({
    description: "Le contenu détaillé de l'actualité",
    example: 'Mise à jour sur les intervenants et le programme...',
    required: false,
  })
  content?: string;
}
