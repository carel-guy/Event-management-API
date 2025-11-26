import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventModule } from './event/event.module';
import { EventAssetModule } from './event-asset/event-asset.module';
import { EventScheduleModule } from './event-schedule/event-schedule.module';
import { EventConfigModule } from './event-config/event-config.module';
import { CustomFieldModule } from './custom-field/custom-field.module';
import { TariffRuleModule } from './tariff-rule/tariff-rule.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './Interceptor/tenant-interceptor';

import { VaultConfigModule } from './vault-config/vault-config.module';
import { VaultConfigService } from './vault-config/vault-config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RequiredDocumentModule } from './required-document/required-document.module';
import { FileReferenceModule } from './file-reference/file-reference.module';
import { MinioModule } from './minio/minio.module';
import { SpeakerModule } from './speaker/speaker.module';
import { PartnerModule } from './partner/partner.module';
import { GrpcServerController } from './grpc/grpc-server.controller';
import { ActualityModule } from './actuality/actuality.module';
import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ReviewModule } from './review/review.module';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './queue/queue.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VaultConfigModule,
    MongooseModule.forRootAsync({
      imports: [VaultConfigModule],
      useFactory: async (coreConfigService: VaultConfigService) => {
        const uri = coreConfigService.get<string>('MONGODB_URI');
        console.log('MongoDB URI:', uri);
        if (!uri) {
          throw new Error('MONGODB_URI is not defined.');
        }
        return {
          uri,
        };
      },
      inject: [VaultConfigService],
    }),
    BullModule.forRootAsync({
      imports: [VaultConfigModule],
      useFactory: async (coreConfigService: VaultConfigService) => ({
        redis: {
          host: coreConfigService.get<string>('REDIS_HOST'),
          port: coreConfigService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [VaultConfigService],
    }),

    EventModule,
    EventAssetModule,
    EventScheduleModule,
    EventConfigModule,
    CustomFieldModule,
    TariffRuleModule,
    RequiredDocumentModule,
    FileReferenceModule,
    MinioModule,
    SpeakerModule,
    PartnerModule,
    ActualityModule,
    UserModule,
    TenantModule,
    KeycloakModule,
    ReviewModule,
    QueueModule,
    EmailModule,
  ],
  controllers: [GrpcServerController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
