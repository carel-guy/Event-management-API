import { Inject, Injectable } from '@nestjs/common';
import { ASYNC_CONFIG_PROVIDER } from './constants';

@Injectable()
export class VaultConfigService {
  constructor(
    @Inject(ASYNC_CONFIG_PROVIDER)
    private readonly vaultConfig: { [key: string]: any },
  ) {}

  get<T>(key: string): T {
    return this.vaultConfig[key] as T;
  }
}
