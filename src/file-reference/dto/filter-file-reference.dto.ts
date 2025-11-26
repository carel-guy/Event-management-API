// src/file-reference/dto/filter-file-reference.dto.ts

import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from 'src/enums';

export class FilterFileReferenceDto {
  @ApiProperty({
    example: 'form', // 'form' as in 'formulaire'
    description:
      'Filtrer par libellé partiel ou complet (insensible à la casse).',
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  // @ApiProperty({
  //   example: FileType.PDF,
  //   description: 'Filtrer par type de fichier.',
  //   enum: FileType,
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(FileType)
  // fileType?: FileType;

  @ApiProperty({
    example: 1,
    description: 'Numéro de page pour la pagination (commence à 1).',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: "Nombre d'éléments par page.",
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
