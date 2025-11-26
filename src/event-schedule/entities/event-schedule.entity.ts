// src/event-schedule/schemas/event-schedule.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsMongoId,
  IsDate,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Speaker } from 'src/speaker/entities/speaker.entity';
import { FileReference } from 'src/file-reference/entities/file-reference.entity';
import { SessionType } from 'src/enums'; // Import the new SessionType enum
import { Event } from 'src/event/entities/event.entity';

export type EventScheduleDocument = EventSchedule & Document;

@Schema({
  timestamps: true,
  collection: 'event_schedules',
})
export class EventSchedule {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: "Event" }) // Add ref for clarity
  @IsMongoId()
  eventId: Types.ObjectId;

  @Prop({ type: String, required: true })
  @IsString()
  title: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @Prop({
    type: String,
    enum: SessionType,
    required: true,
    default: SessionType.OTHER,
  }) // Changed to SessionType
  @IsEnum(SessionType)
  sessionType: SessionType; // Renamed from 'type'

  @Prop({ type: Date, required: true })
  @IsDate()
  startTime: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  endTime: Date;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string; // Keep as string for simplicity

  @Prop({
    type: [{ type: Types.ObjectId, ref: Speaker.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsMongoId({ each: true })
  speakers?: Types.ObjectId[];

  @Prop({ type: String, ref: FileReference.name, required: false })
  @IsOptional()
  imageFileReferenceId?: string;
}

export const EventScheduleSchema = SchemaFactory.createForClass(EventSchedule);

EventScheduleSchema.index({ tenantId: 1, eventId: 1, startTime: 1 });
EventScheduleSchema.index({ tenantId: 1, eventId: 1, sessionType: 1 });
