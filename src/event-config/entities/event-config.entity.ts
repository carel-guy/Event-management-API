import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsBoolean,
  IsNumber,
  IsDate,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export type EventConfigDocument = EventConfig & Document;

@Schema({
  timestamps: true,
  collection: 'event_configs',
})
export class EventConfig {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, unique: true })
  @IsMongoId()
  eventId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  isRegistrationOpen: boolean;

  @Prop({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @Prop({ type: Date, required: false })
  @IsOptional()
  @IsDate()
  registrationStartDate?: Date;

  @Prop({ type: Date, required: false })
  @IsOptional()
  @IsDate()
  registrationEndDate?: Date;
}

export const EventConfigSchema = SchemaFactory.createForClass(EventConfig);

EventConfigSchema.index({ tenantId: 1, eventId: 1 }, { unique: true });
