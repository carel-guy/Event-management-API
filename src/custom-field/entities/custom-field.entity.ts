import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
} from 'class-validator';
import { FieldType } from 'src/enums';

export type CustomFieldDocument = CustomField & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'custom_fields' })
export class CustomField {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  @IsString()
  key: string;

  @Prop({ type: String, enum: FieldType, required: true })
  @IsString()
  type: FieldType;

  @Prop({ type: String, required: true })
  @IsString()
  label: string;

  @Prop({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @Prop({ type: [String], required: false, default: [] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @Prop({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  validation?: Record<string, any>;
}

export const CustomFieldSchema = SchemaFactory.createForClass(CustomField);

CustomFieldSchema.index({ tenantId: 1, key: 1 }, { unique: true });
