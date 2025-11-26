// src/review/review.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Review, ReviewSchema } from './entities/review.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event-schedule/entities/event-schedule.entity';
import { VaultConfigModule } from 'src/vault-config/vault-config.module';
import { VaultConfigService } from 'src/vault-config/vault-config.service';
import { QueueModule } from 'src/queue/queue.module';
import { Speaker, SpeakerSchema } from 'src/speaker/entities/speaker.entity';

@Module({
  imports: [
    VaultConfigModule,
    QueueModule,
    ClientsModule.registerAsync([
      {
        name: 'REGISTRATION_PACKAGE',
        useFactory: (configService: VaultConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'registration',
            url: configService.get<string>('EVENT_REGISTRATION_SERVICE_URL'),
            protoPath: join(process.cwd(), 'src/proto/registration.proto'),
          },
        }),
        inject: [VaultConfigService],
      },
    ]),
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      {name:Speaker.name,schema:SpeakerSchema}
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
