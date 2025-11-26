import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsMongoId } from 'class-validator';

export type RequiredDocumentDocument = RequiredDocument & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'required_documents',
})
export class RequiredDocument {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  @IsString()
  key: string;

  @Prop({ type: String, required: true })
  @IsString()
  label: string;
}

export const RequiredDocumentSchema =
  SchemaFactory.createForClass(RequiredDocument);

RequiredDocumentSchema.index({ tenantId: 1, key: 1 }, { unique: true });
