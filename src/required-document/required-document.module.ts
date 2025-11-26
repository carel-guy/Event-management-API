import { Module } from '@nestjs/common';
import { RequiredDocumentService } from './required-document.service';
import { RequiredDocumentController } from './required-document.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RequiredDocument,
  RequiredDocumentSchema,
} from './entities/required-document.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequiredDocument.name, schema: RequiredDocumentSchema },
    ]),
  ],
  controllers: [RequiredDocumentController],
  providers: [RequiredDocumentService],
  exports: [RequiredDocumentService],
})
export class RequiredDocumentModule {}
