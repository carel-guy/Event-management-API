// src/custom-field/dto/create-custom-field.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsObject,
  IsEnum,
} from 'class-validator';
import { FieldType } from '../../enums'; // Adjust path if FieldType is in a different file

export class CreateCustomFieldDto {
  @ApiProperty({
    description: 'La clé unique pour le champ personnalisé.',
    example: 'capacite_evenement',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description:
      'Le type du champ personnalisé (par exemple, "texte", "nombre", "booléen").',
    enum: FieldType,
    example: FieldType.NUMBER,
  })
  @IsEnum(FieldType)
  @IsNotEmpty()
  type: FieldType;

  @ApiProperty({
    description: "Le libellé lisible par l'homme pour le champ personnalisé.",
    example: "Capacité de l'événement",
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Indique si ce champ personnalisé est obligatoire.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiProperty({
    description:
      "Tableau d'options prédéfinies pour les champs de type sélection/radio.",
    type: [String],
    required: false,
    default: [],
    example: ['Option A', 'Option B', 'Option C'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description:
      'Objet JSON pour les règles de validation spécifiques au champ (par exemple, { min: 1, max: 100 } pour les nombres, { pattern: "^[A-Z]+$" } pour le texte).',
    type: Object,
    required: false,
    example: { minLength: 5, maxLength: 50 },
  })
  @IsOptional()
  @IsObject()
  validation?: Record<string, any>;
}
