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
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import {
  EventType,
  EventStatus,
  Currency,
  EventFormat,
  Timezone,
} from 'src/enums'; // Assuming EventFormat would be added here
import { RequiredDocument } from 'src/required-document/entities/required-document.entity';
import { FileReference } from 'src/file-reference/entities/file-reference.entity';
import { TarifRule } from 'src/tariff-rule/entities/tariff-rule.entity';
import { CustomField } from 'src/custom-field/entities/custom-field.entity';
import { Partner } from 'src/partner/entities/partner.entity';
import { Speaker } from 'src/speaker/entities/speaker.entity';
import { EventSchedule } from 'src/event-schedule/entities/event-schedule.entity';

// New enum for Event Format (add this to your src/enums/index.ts)

export type EventDocument = Event & Document;

// Interface for Location Details (can be defined in a types file or above the schema)
interface LocationDetails {
  name: string;
  address: string;
}

// Interface for Social Link (can be defined in a types file or above the schema)
interface SocialLink {
  platform: string;
  url: string;
}

@Schema({
  timestamps: true,
  collection: 'events',
})
export class Event {
  @Prop({ type: Types.ObjectId, required: false, index: true, default: null })
  @IsMongoId()
  @IsOptional()
  tenantId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  @IsString()
  title: string;

  @Prop({ type: String, required: false, default: null })
  @IsOptional()
  @IsString()
  description?: string;

  @Prop({
    type: String,
    required: true,
    enum: EventType,
    default: EventType.CONFERENCE,
  })
  @IsEnum(EventType)
  type: EventType;

  // --- NEW ATTRIBUTE: Event Format ---
  @Prop({
    type: String,
    required: true,
    enum: EventFormat,
    default: EventFormat.IN_PERSON,
  })
  @IsEnum(EventFormat)
  format: EventFormat;

  @Prop({
    type: String,
    required: false,
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @IsEnum(EventStatus)
  status: EventStatus;

  @Prop({ type: Date, required: true })
  @IsDate()
  startDate: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  endDate: Date;

  @Prop({ type: String, required: true, enum: Timezone, default: Timezone.UTC })
  @IsEnum(Timezone)
  timezone: Timezone;

  // --- MODIFIED ATTRIBUTE: Location as array of objects ---
  @Prop({
    type: [{ name: { type: String }, address: { type: String } }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  // You might add a custom validator for LocationDetails[] if needed for stricter checks
  locations?: LocationDetails[]; // Renamed from 'location' to 'locations' for clarity with array

  @Prop({ type: String, required: false, default: null })
  @IsOptional()
  @IsString()
  avenue?: string;

  @Prop({ type: String, required: false, default: null })
  @IsOptional()
  @IsString()
  adresse?: string;

  @Prop({ type: String, required: false, default: null })
  @IsOptional()
  @IsString()
  virtualUrl?: string;

  // --- NEW ATTRIBUTE: Number of Participants ---
  @Prop({ type: Number, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfParticipants?: number;

  @Prop({ type: String, required: true, enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @Prop({
    type: [{ type: Types.ObjectId, ref: CustomField.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  customFieldIds?: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: RequiredDocument.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  requiredDocumentIds?: Types.ObjectId[];

  @Prop({
    type: String, // allows ObjectId or String
    required: false,
    default: null,
  })
  fileReferenceIds?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: TarifRule.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  tariffRuleIds?: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: Partner.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  partnerIds?: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: EventSchedule.name }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true }) // Validate each ID in the array
  eventScheduleIds?: Types.ObjectId[];

  // --- NEW ATTRIBUTE: Social Links ---
  @Prop({
    type: [{ platform: { type: String }, url: { type: String } }],
    required: false,
    default: [],
  })
  @IsOptional()
  @IsArray()
  // You might add a custom validator for SocialLink[] if needed for URL format/platform validation
  socialLinks?: SocialLink[];

  @Prop({ type: Boolean, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  @IsMongoId()
  @IsOptional()
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  @IsMongoId()
  @IsOptional()
  updatedBy?: Types.ObjectId;

  // Timestamps are managed by Mongoose (@Schema({ timestamps: true })),
  // but we declare them here for TypeScript type safety.
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Existing Indexes
EventSchema.index({ tenantId: 1, type: 1 });
EventSchema.index({ tenantId: 1, status: 1 });
EventSchema.index({ tenantId: 1, startDate: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ tenantId: 1, currency: 1 });
EventSchema.index({ tenantId: 1, createdBy: 1 });

// Pre-save hooks for tenantId consistency on referenced documents
EventSchema.pre('save', async function (next) {
  if (
    this.fileReferenceIds &&
    Array.isArray(this.fileReferenceIds) &&
    this.fileReferenceIds.length > 0
  ) {
    const fileReferences = await this.model('FileReference')
      .find({ _id: { $in: this.fileReferenceIds }, tenantId: this.tenantId })
      .exec();
    if (fileReferences.length !== this.fileReferenceIds.length) {
      throw new Error(
        "One or more file references do not match the event's tenantId",
      );
    }
  }
  next();
});

EventSchema.pre('save', async function (next) {
  if (this.requiredDocumentIds && this.requiredDocumentIds.length > 0) {
    const requiredDocuments = await this.model('RequiredDocument')
      .find({ _id: { $in: this.requiredDocumentIds }, tenantId: this.tenantId })
      .exec();
    if (requiredDocuments.length !== this.requiredDocumentIds.length) {
      throw new Error(
        "One or more required documents do not match the event's tenantId",
      );
    }
  }
  next();
});

EventSchema.pre('save', async function (next) {
  if (this.partnerIds && this.partnerIds.length > 0) {
    const partners = await this.model('Partner')
      .find({ _id: { $in: this.partnerIds }, tenantId: this.tenantId })
      .exec();
    if (partners.length !== this.partnerIds.length) {
      throw new Error("One or more partners do not match the event's tenantId");
    }
  }
  next();
});

EventSchema.pre('save', async function (next) {
  if (this.eventScheduleIds && this.eventScheduleIds.length > 0) {
    const eventSchedules = await this.model('EventSchedule')
      .find({ _id: { $in: this.eventScheduleIds }, tenantId: this.tenantId })
      .exec();
    if (eventSchedules.length !== this.eventScheduleIds.length) {
      throw new Error(
        "One or more event schedules do not match the event's tenantId",
      );
    }
  }
  next();
});
