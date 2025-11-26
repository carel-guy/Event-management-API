import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsBoolean,
  Min,
  IsMongoId,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { TarifType, Currency, ValueType } from 'src/enums'; // Ensure these enums are correctly imported

@Schema({
  timestamps: true,
  collection: 'tariff_rules',
})
export class TarifRule {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Prop({ type: String, enum: TarifType, required: true })
  @IsEnum(TarifType)
  tariffType: TarifType;

  @Prop({
    type: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
      },
    ],
    required: true,
  })
  @IsArray()
  conditions: Array<{
    field: string;
    operator: string;
    value: string | string[];
  }>;

  @Prop({ required: true })
  @IsNumber()
  @Min(0)
  amount: number;

  @Prop({ type: String, enum: ValueType, required: true })
  @IsEnum(ValueType)
  amountType: ValueType;

  @Prop({ type: String, enum: Currency, required: true })
  @IsEnum(Currency)
  currency: Currency;

  @Prop({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Prop({ type: Date, required: true })
  @IsDate()
  validFrom: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  validUntil: Date;
}

export const TarifRuleSchema = SchemaFactory.createForClass(TarifRule);

// Indexes for performance
TarifRuleSchema.index({ tenantId: 1, isActive: 1 });
TarifRuleSchema.index({ tenantId: 1, validFrom: 1, validUntil: 1 });
