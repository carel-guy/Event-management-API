import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultConfigService } from './vault-config.service';
import { VaultService } from './vault.service';
import { VaultInitializerService } from './vault-initializer.service';
import { ASYNC_CONFIG_PROVIDER } from './constants';

const configProvider = {
  provide: ASYNC_CONFIG_PROVIDER,
  useFactory: async (initializer: VaultInitializerService) => {
    return await initializer.getConfig();
  },
  inject: [VaultInitializerService],
};

const vaultServiceProvider = {
  provide: VaultService,
  useFactory: () => {
    return new VaultService({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN,
    });
  },
};

@Global()
@Module({
  imports: [],
  providers: [
    VaultConfigService,
    vaultServiceProvider,
    VaultInitializerService,
    configProvider,
  ],
  exports: [VaultConfigService, configProvider.provide],
})
export class VaultConfigModule {}
