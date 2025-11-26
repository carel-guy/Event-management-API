import { Module } from '@nestjs/common';
import { EventConfigService } from './event-config.service';
import { EventConfigController } from './event-config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventConfig, EventConfigSchema } from './entities/event-config.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventConfig.name, schema: EventConfigSchema },
    ]),
  ],
  controllers: [EventConfigController],
  providers: [EventConfigService],
  exports: [EventConfigService],
})
export class EventConfigModule {}
