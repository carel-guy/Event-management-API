import { Module } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldController } from './custom-field.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomField, CustomFieldSchema } from './entities/custom-field.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomField.name, schema: CustomFieldSchema },
    ]),
  ],
  controllers: [CustomFieldController],
  providers: [CustomFieldService],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}
