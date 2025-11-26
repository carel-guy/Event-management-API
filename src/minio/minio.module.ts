// src/minio/minio.module.ts

import { Module } from '@nestjs/common';
import { VaultConfigModule } from '../vault-config/vault-config.module';
import { VaultConfigService } from '../vault-config/vault-config.service';
import { MinioService } from './minio.service';

@Module({
  imports: [VaultConfigModule],
  providers: [
    {
      provide: MinioService,
      useFactory: (configService: VaultConfigService) => {
        return new MinioService(
          {
            endPoint: configService.get<string>('MINIO_ENDPOINT'),
            port: +configService.get<number>('MINIO_PORT'),
            useSSL: configService.get<string>('MINIO_USE_SSL') === 'true',
            accessKey: configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: configService.get<string>('MINIO_SECRET_KEY'),
          },
          configService.get<string>('MINIO_BUCKET_NAME'),
        );
      },
      inject: [VaultConfigService],
    },
  ],
  exports: [MinioService],
})
export class MinioModule {}
