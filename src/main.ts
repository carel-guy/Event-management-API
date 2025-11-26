// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { VaultConfigService } from './vault-config/vault-config.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EventModule } from './event/event.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap(logger = new Logger('Bootstrap')) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(process.cwd(), 'public'));

  const configService = app.get(VaultConfigService);

  // Enable CORS if neededX
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Waangu Event Management API')
    .setDescription(
      'API documentation for the Waangu Event Service microservice.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const appPort = configService.get<number>('APP_PORT') || '';
  const appHost = configService.get<string>('APP_HOST') || '';

  await app.listen(appPort, appHost, () => {
    console.log(`Application is running on: http://${appHost}:${appPort}`);
    console.log(
      `Swagger documentation available at: http://${appHost}:${appPort}/api`,
    );
  });

  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'event',
        protoPath: join(process.cwd(), 'src/proto/event.proto'),
        url: configService.get<string>('EVENT_SERVICE_URL') || '',
      },
    },
  );

  // Start gRPC server
  await grpcApp.listen();
  logger.log(
    `gRPC server running on ${configService.get<string>('EVENT_SERVICE_URL') || ''}`,
  );
}
bootstrap();
