import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsMongoId, IsOptional, IsNotEmpty } from 'class-validator';
import { FileType } from 'src/enums';

export type FileReferenceDocument = FileReference & Document;

@Schema({
  timestamps: true,
  collection: 'file_references',
})
export class FileReference {
  @Prop({ type: Types.ObjectId, required: true })
  @IsMongoId()
  tenantId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    validate: [
      {
        validator: function (value: string) {
          return value.startsWith(`/${this.tenantId}/`);
        },
        message: 'Path must start with /tenantId/',
      },
      {
        validator: function (value: string) {
          return /\/[a-f0-9]{24}\/.+(\.[a-zA-Z0-9]{1,5})$/.test(value);
        },
        message: 'Path must include a valid file extension (e.g., .jpg, .pdf)',
      },
    ],
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @Prop({ type: String, enum: FileType, required: false })
  @IsString()
  @IsOptional()
  fileType?: FileType;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  @IsMongoId()
  @IsOptional()
  uploadedBy?: Types.ObjectId;

  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  label?: string;
}

export const FileReferenceSchema = SchemaFactory.createForClass(FileReference);

FileReferenceSchema.index({ tenantId: 1, path: 1 }, { unique: true });
