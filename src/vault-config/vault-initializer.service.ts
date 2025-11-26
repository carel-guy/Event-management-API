import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VaultService } from './vault.service';

@Injectable()
export class VaultInitializerService {
  private readonly logger = new Logger(VaultInitializerService.name);

  constructor(
    private readonly vaultService: VaultService,
    private readonly configService: ConfigService,
  ) {}

  async getConfig(): Promise<{ [key: string]: any }> {
    this.logger.log('Initializing configuration from Vault...');
    const vaultPath = this.configService.get<string>(
      'VAULT_PATH',
      'waangu-event-management/data/waangu-event-management',
    );
    const secrets = await this.vaultService.getSecrets(vaultPath);

    if (secrets) {
      this.logger.log('Successfully loaded configuration from Vault.');
      return secrets;
    } else {
      this.logger.warn(
        'Could not load configuration from Vault. Falling back to .env file.',
      );
      // When Vault fails, the configuration will be read directly from process.env
      // which is populated by ConfigModule. The CoreConfigService will then use this.
      const envConfig = {
        MONGODB_URI: this.configService.get<string>('MONGODB_URI'),
        REDIS_HOST: this.configService.get<string>('REDIS_HOST'),
        REDIS_PORT: this.configService.get<number>('REDIS_PORT'),
        MINIO_ENDPOINT: this.configService.get<string>('MINIO_ENDPOINT'),
        MINIO_PORT: this.configService.get<number>('MINIO_PORT'),
        MINIO_USE_SSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
        MINIO_ACCESS_KEY: this.configService.get<string>('MINIO_ACCESS_KEY'),
        MINIO_SECRET_KEY: this.configService.get<string>('MINIO_SECRET_KEY'),
        MINIO_BUCKET_NAME: this.configService.get<string>('MINIO_BUCKET_NAME'),
        KEYCLOAK_URL: this.configService.get<string>('KEYCLOAK_URL'),
        KEYCLOAK_REALM: this.configService.get<string>('KEYCLOAK_REALM'),
        KEYCLOAK_CLIENT_ID: this.configService.get<string>('KEYCLOAK_CLIENT_ID'),
        KEYCLOAK_CLIENT_SECRET: this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
        KEYCLOAK_ADMIN_USER: this.configService.get<string>('KEYCLOAK_ADMIN_USER'),
        KEYCLOAK_ADMIN_PASSWORD: this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD'),
        GMAIL_USER: this.configService.get<string>('GMAIL_USER'),
        GMAIL_PASS: this.configService.get<string>('GMAIL_PASS'),
        APP_HOST: this.configService.get<string>('APP_HOST'),
        APP_PORT: this.configService.get<number>('APP_PORT'),
        EVENT_REGISTRATION_SERVICE_URL: this.configService.get<string>('EVENT_REGISTRATION_SERVICE_URL'),
      };
      return envConfig;
    }
  }
}
