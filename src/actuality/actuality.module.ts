import { Module } from '@nestjs/common';
import { ActualitiesController } from './actuality.controller';
import { ActualitiesService } from './actuality.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Actuality, ActualitySchema } from './entities/actuality.entity';
import { KeycloakModule } from '../keycloak/keycloak.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Actuality.name, schema: ActualitySchema },
    ]),
    KeycloakModule,
  ],
  controllers: [ActualitiesController],
  providers: [ActualitiesService],
  exports: [ActualitiesService],
})
export class ActualityModule {}
