import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TarifType, Currency, ValueType } from 'src/enums';
import { ConditionDto, CreateTarifRuleDto } from './create-tariff-rule.dto';

export class UpdateTarifRuleDto extends PartialType(CreateTarifRuleDto) {
  @ApiProperty({
    type: [ConditionDto],
    example: [{ field: 'poids', operator: 'superieur_a', value: '5' }],
    description:
      "Un tableau de conditions mises à jour pour que cette règle tarifaire s'applique. Ceci remplacera les conditions existantes.",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];
}
