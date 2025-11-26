import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { KeycloakModule } from '../keycloak/keycloak.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    KeycloakModule,
  ],
  controllers: [TenantController],
  providers: [TenantService, ConfigService],
  exports: [TenantService, MongooseModule],
})
export class TenantModule {}
