import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { AssetCategory } from 'src/enums';

export type EventAssetDocument = EventAsset & Document;

@Schema({
  timestamps: true,
  collection: 'event_assets',
})
export class EventAsset {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  eventId: Types.ObjectId;

  @Prop({ type: String, required: true })
  @IsString()
  name: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @Prop({ type: Number, required: true, min: 0 })
  @IsNumber()
  quantity: number;

  @Prop({
    type: String,
    required: false,
    enum: AssetCategory,
    default: AssetCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;
}

export const EventAssetSchema = SchemaFactory.createForClass(EventAsset);

EventAssetSchema.index({ tenantId: 1, eventId: 1 });
