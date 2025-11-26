import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FileReference } from 'src/file-reference/entities/file-reference.entity';

export type PartnerDocument = Partner & Document;

@Schema({
  timestamps: true,
  collection: 'partners',
})
export class Partner {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, ref: FileReference.name, required: false })
  logo?: string;

  @Prop({ type: String, required: false })
  website?: string;

  @Prop({ type: String, required: false })
  description?: string;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);

PartnerSchema.index({ tenantId: 1, name: 1 }, { unique: true });
