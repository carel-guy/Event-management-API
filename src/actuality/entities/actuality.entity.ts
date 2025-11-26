import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileReference } from 'src/file-reference/entities/file-reference.entity';
import { ActualityType } from 'src/enums';

export type ActualityDocument = Actuality & Document;

@Schema({
  timestamps: true,
  collection: 'actualities',
})
export class Actuality {
  @Prop({ type: Types.ObjectId, required: true, index: true, default: null })
  @IsMongoId()
  @IsOptional()
  tenantId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: false,
    default: null,
    reference: Event.name,
  })
  @IsMongoId()
  @IsOptional()
  eventId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  @IsString()
  title: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @Prop({ type: String, required: true, enum: ActualityType })
  @IsEnum(ActualityType)
  type: ActualityType;

  @Prop({ type: Date, required: true, default: Date.now })
  @IsDate()
  publishedAt: Date;

  @Prop({
    type: String,
    required: false,
    default: null,
    reference: FileReference.name,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @Prop({ type: Boolean, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Prop({ type: String, required: false, default: null })
  @IsOptional()
  externalLink?: string;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  @IsMongoId()
  @IsOptional()
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  @IsMongoId()
  @IsOptional()
  updatedBy?: Types.ObjectId;
}

export const ActualitySchema = SchemaFactory.createForClass(Actuality);

ActualitySchema.index({ tenantId: 1, publishedAt: -1 });
ActualitySchema.index({ tenantId: 1, type: 1, publishedAt: -1 });
ActualitySchema.index(
  { tenantId: 1, eventId: 1, publishedAt: -1 },
  { sparse: true },
);
ActualitySchema.index({ isActive: 1, publishedAt: -1 });
