import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TarifType, Currency, ValueType } from 'src/enums';

export class FilterTarifRuleDto {
  @ApiProperty({
    description: 'Filtrer par nom partiel ou complet (insensible à la casse).',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filtrer par type de tarif.',
    enum: TarifType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TarifType)
  tariffType?: TarifType;

  @ApiProperty({
    description: 'Filtrer par devise.',
    enum: Currency,
    required: false,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    description: 'Filtrer par type de montant.',
    enum: ValueType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ValueType)
  amountType?: ValueType;

  @ApiProperty({ description: 'Filtrer par statut actif.', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

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
