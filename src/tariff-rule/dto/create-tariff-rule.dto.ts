import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  ArrayMinSize,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TarifType, Currency, ValueType } from 'src/enums';

export class ConditionDto {
  @ApiProperty({
    example: 'date_inscription',
    description: 'Le champ sur lequel appliquer la condition.',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    example: 'entre',
    description: "L'opérateur pour la condition (ex: égal_à, entre).",
  })
  @IsString()
  @IsNotEmpty()
  operator: string;

  @ApiProperty({
    example: ['2025-06-01T00:00:00Z', '2025-06-30T23:59:59Z'],
    description: "La valeur à comparer (chaîne ou tableau selon l'opérateur).",
  })
  @IsNotEmpty()
  value: string | string[]; // Permet une chaîne ou un tableau
}

export class CreateTarifRuleDto {
  @ApiProperty({
    example: 'Tarif Standard Juin',
    description: 'Un nom unique pour la règle tarifaire.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Tarif pour les inscriptions en juin - catégorie Standard',
    description: 'Description facultative de la règle tarifaire.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: TarifType.FLAT_CHARGE,
    description: 'Le type de tarif.',
    enum: TarifType,
  })
  @IsEnum(TarifType)
  tariffType: TarifType; // Aligné avec le schéma

  @ApiProperty({
    type: [ConditionDto],
    example: [
      {
        field: 'date_inscription',
        operator: 'entre',
        value: ['2025-06-01T00:00:00Z', '2025-06-30T23:59:59Z'],
      },
      {
        field: 'categorie_billet',
        operator: 'égal_à',
        value: 'standard',
      },
    ],
    description: 'Un tableau de conditions pour appliquer la règle tarifaire.',
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions: ConditionDto[];

  @ApiProperty({
    example: 50.0,
    description: 'Le montant du tarif.',
  })
  @IsNumber()
  @Min(0)
  amount: number; // Changé de "value" à "amount" pour correspondre au schéma

  @ApiProperty({
    example: ValueType.FIXED,
    description: 'Indique si le montant est fixe ou un pourcentage.',
    enum: ValueType,
  })
  @IsEnum(ValueType)
  amountType: ValueType; // Changé de "valueType" à "amountType"

  @ApiProperty({
    example: Currency.USD,
    description: 'La devise du tarif.',
    enum: Currency,
  })
  @IsEnum(Currency)
  currency: Currency; // Rendu obligatoire comme dans le schéma

  @ApiProperty({
    example: true,
    description: 'Indique si la règle est active.',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    example: '2025-06-01T00:00:00Z',
    description: 'La date de début de validité de la règle.',
  })
  @IsDate()
  @Type(() => Date)
  validFrom: Date; // Changé de "startDate" à "validFrom"

  @ApiProperty({
    example: '2025-06-30T23:59:59Z',
    description: 'La date de fin de validité de la règle.',
  })
  @IsDate()
  @Type(() => Date)
  validUntil: Date; // Changé de "endDate" à "validUntil"
}
