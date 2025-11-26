import { Module } from '@nestjs/common';
import { EventScheduleService } from './event-schedule.service';
import { EventScheduleController } from './event-schedule.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventSchedule,
  EventScheduleSchema,
} from './entities/event-schedule.entity';
import { EventSchema, Event } from 'src/event/entities/event.entity';
import { Speaker, SpeakerSchema } from 'src/speaker/entities/speaker.entity';
import {
  FileReference,
  FileReferenceSchema,
} from 'src/file-reference/entities/file-reference.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Event.name, schema: EventSchema },
      { name: Speaker.name, schema: SpeakerSchema },
      { name: FileReference.name, schema: FileReferenceSchema },
    ]),
  ],
  controllers: [EventScheduleController],
  providers: [EventScheduleService],
  exports: [EventScheduleService],
})
export class EventScheduleModule {}
