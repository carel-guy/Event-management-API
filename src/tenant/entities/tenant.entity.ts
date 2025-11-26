import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  realm: string;

  @Prop({ required: true })
  clientId: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
