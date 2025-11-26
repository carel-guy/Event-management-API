import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema, Event } from './entities/event.entity';
import {
  CustomField,
  CustomFieldSchema,
} from 'src/custom-field/entities/custom-field.entity';
import {
  RequiredDocument,
  RequiredDocumentSchema,
} from 'src/required-document/entities/required-document.entity';
import {
  FileReference,
  FileReferenceSchema,
} from 'src/file-reference/entities/file-reference.entity';
import {
  TarifRule,
  TarifRuleSchema,
} from 'src/tariff-rule/entities/tariff-rule.entity';
import { Partner, PartnerSchema } from 'src/partner/entities/partner.entity';

import { VaultConfigModule } from '../vault-config/vault-config.module';
import { VaultConfigService } from '../vault-config/vault-config.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { GrpcServerController } from 'src/grpc/grpc-server.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { UserModule } from 'src/user/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from 'src/Interceptor/tenant-interceptor';
import { Speaker, SpeakerSchema } from 'src/speaker/entities/speaker.entity';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event-schedule/entities/event-schedule.entity';

@Module({
  imports: [
    VaultConfigModule,
    KeycloakModule,
    TenantModule,
    UserModule,
    ClientsModule.registerAsync([
      {
        name: 'REGISTRATION_SERVICE',
        useFactory: (configService: VaultConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'registration',
            protoPath: join(process.cwd(), 'src/proto/registration.proto'),
            loader: {
              includeDirs: [join(process.cwd(), 'src/proto')],
            },
            url: configService.get<string>('REGISTRATION_SERVICE_URL'),
          },
        }),
        inject: [VaultConfigService],
      },
    ]),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: CustomField.name, schema: CustomFieldSchema },
      { name: RequiredDocument.name, schema: RequiredDocumentSchema },
      { name: FileReference.name, schema: FileReferenceSchema },
      { name: TarifRule.name, schema: TarifRuleSchema },
      { name: Partner.name, schema: PartnerSchema },
      { name: Speaker.name, schema: SpeakerSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
    ]),
  ],
  controllers: [EventController, GrpcServerController],
  providers: [
    EventService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor, // Apply interceptor globally (will be skipped for gRPC due to updated logic)
    },
  ],
  exports: [EventService],
})
export class EventModule {}
