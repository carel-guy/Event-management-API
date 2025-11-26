import { BullModule } from '@nestjs/bull';
import { VaultConfigModule } from 'src/vault-config/vault-config.module';
import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { SpeakerModule } from '../speaker/speaker.module';
import { EventScheduleModule } from '../event-schedule/event-schedule.module';
import { EmailProcessor } from './email.processor';
import { QueueService } from './queue.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchedule, EventScheduleSchema } from 'src/event-schedule/entities/event-schedule.entity';
import { VaultConfigService } from 'src/vault-config/vault-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventSchedule.name, schema: EventScheduleSchema },
    ]),
    EmailModule,
    SpeakerModule,
    EventScheduleModule,
    BullModule.forRootAsync({
      useFactory: async (configService: VaultConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      imports: [VaultConfigModule],
      inject: [VaultConfigService],
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [QueueService, EmailProcessor],
  exports: [QueueService],
})
export class QueueModule {}
