// src/review/entities/review.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';
import { EventSchedule } from 'src/event-schedule/entities/event-schedule.entity';
import { Speaker } from 'src/speaker/entities/speaker.entity';

export type ReviewDocument = Review & Document;

@Schema({
  timestamps: true,
  collection: 'reviews',
})
export class Review {
  _id: Types.ObjectId; // Added for type safety
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: EventSchedule.name,
  })
  @IsMongoId()
  eventScheduleId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  @IsString()
  registrationId: string; // Reference to registration in other microservice

  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  registrationName?: string; // Cache name for display purposes

  @Prop({ type: Number, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Prop({ type: String, required: true })
  @IsString()
  comment: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Speaker.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  taggedSpeakers?: Speaker[];

  createdAt: Date; // Added for type safety
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ tenantId: 1, eventScheduleId: 1 });
ReviewSchema.index({ registrationId: 1 }); // New index for lookups
