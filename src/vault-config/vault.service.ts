import { Injectable, Logger } from '@nestjs/common';

import * as Vault from 'node-vault';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private vault: Vault.client;

  constructor(options: Vault.VaultOptions) {
    if (!options.endpoint || !options.token) {
      this.logger.warn('Vault address or token not provided. VaultService will not be initialized.');
      return;
    }
    this.vault = Vault.default(options);
  }

  async getSecrets(path: string): Promise<Record<string, any> | null> {
    if (!this.vault) {
        this.logger.error('Vault client is not initialized.');
        return null;
    }
    try {
      const result = await this.vault.read(path);
      return result.data.data; // Vault secrets are nested under data.data
    } catch (error) {
      this.logger.error(`Failed to fetch secrets from Vault at path: ${path}`, error.stack);
      return null;
    }
  }
}
