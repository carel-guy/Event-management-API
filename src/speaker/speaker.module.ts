import { Module } from '@nestjs/common';
import { SpeakerService } from './speaker.service';
import { SpeakerController } from './speaker.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Speaker, SpeakerSchema } from './entities/speaker.entity';
import { MinioModule } from 'src/minio/minio.module';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event-schedule/entities/event-schedule.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Speaker.name, schema: SpeakerSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
    ]),
    MinioModule,
  ],
  controllers: [SpeakerController],
  providers: [SpeakerService],
  exports: [SpeakerService],
})
export class SpeakerModule {}
