import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterRequiredDocumentDto {
  @ApiProperty({
    example: 'passeport', // passport
    description:
      'Filtrer par clé partielle ou complète (insensible à la casse).',
    required: false,
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    example: 'domicile', // address
    description:
      'Filtrer par libellé partiel ou complet (insensible à la casse).',
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

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
