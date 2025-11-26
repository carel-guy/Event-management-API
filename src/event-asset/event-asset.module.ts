import { Module } from '@nestjs/common';
import { EventAssetService } from './event-asset.service';
import { EventAssetController } from './event-asset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventAsset, EventAssetSchema } from './entities/event-asset.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventAsset.name, schema: EventAssetSchema },
    ]),
  ],
  controllers: [EventAssetController],
  providers: [EventAssetService],
  exports: [EventAssetService],
})
export class EventAssetModule {}
