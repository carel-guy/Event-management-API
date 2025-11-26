// src/speaker/schemas/speaker.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import {
  IsString,
  IsMongoId,
  IsOptional,
  IsUrl,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { SpeakerType } from 'src/enums'; // Assuming SpeakerType enum is defined here
import { FileReference } from 'src/file-reference/entities/file-reference.entity'; // Ensure this path is correct and FileReference schema exists

export type SpeakerDocument = Speaker & Document;

@Schema({
  timestamps: true,
  collection: 'speakers',
})
export class Speaker {
  _id: Types.ObjectId; // Added for type safety
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true }) // 'unique: true' is handled by the compound index below
  @IsString()
  name: string;

  @Prop({ type: String, required: false, unique: true, sparse: true }) // unique + sparse for optional unique fields
  @IsOptional()
  @IsEmail()
  email?: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  // REMOVED: profilePictureKey - This is now managed by FileReference

  @Prop({ type: String, enum: SpeakerType, required: false })
  @IsOptional()
  @IsEnum(SpeakerType)
  speakerType?: SpeakerType;

  @Prop({
    type: [mongoose.Schema.Types.Mixed], // allows ObjectId or String
    required: false,
    default: [],
  })
  @IsOptional()
  profilePictureId?: Types.ObjectId | string; // Corrected type to Types.ObjectId
}

export const SpeakerSchema = SchemaFactory.createForClass(Speaker);

// This index correctly enforces unique names per tenant, which is robust
SpeakerSchema.index({ tenantId: 1, name: 1 }, { unique: true });
