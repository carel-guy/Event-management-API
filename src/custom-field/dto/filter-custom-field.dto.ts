// src/custom-field/dto/filter-custom-field.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '../../enums'; // Adjust path

export class FilterCustomFieldDto {
  @ApiProperty({
    description:
      'Filtrer les champs personnalisés par clé (correspondance partielle insensible à la casse).',
    required: false,
    example: 'capacite_evenement',
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    description: 'Filtrer les champs personnalisés par type.',
    enum: FieldType,
    required: false,
    example: FieldType.TEXT_AREA,
  })
  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;

  @ApiProperty({
    description:
      'Filtrer les champs personnalisés par libellé (correspondance partielle insensible à la casse).',
    required: false,
    example: 'Nom du participant',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    description: 'Filtrer par statut obligatoire (vrai/faux).',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  required?: boolean;

  @ApiProperty({
    description:
      'Filtrer les champs personnalisés qui ont des options définies (vrai/faux).',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasOptions?: boolean;

  @ApiProperty({
    description: 'Numéro de page pour la pagination.',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page pour la pagination.",
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
