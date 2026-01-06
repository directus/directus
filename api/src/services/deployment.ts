import type { AbstractServiceOptions, Item, PrimaryKey, Query } from '@directus/types';
import { getDeploymentDriver } from '../deployment.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import type { Credentials, Options, ProviderType } from '../types/index.js';
import { ItemsService } from './items.js';

export interface DeploymentConfig extends Item {
  id: string;
  type: ProviderType;
  credentials: string; // JSON string (encrypted in DB)
  options: object | null;
  date_created: string;
  user_created: string;
}

export class DeploymentService extends ItemsService<DeploymentConfig> {
  constructor(options: AbstractServiceOptions) {
    super('directus_deployment', options);
  }

  /**
   * Read deployment config by type
   */
  async readByType(type: ProviderType, query?: Query): Promise<DeploymentConfig> {
    const results = await this.readByQuery({
      ...query,
      filter: { type: { _eq: type } },
      limit: 1,
    });

    if (!results || results.length === 0) {
      throw new Error(`Deployment config for "${type}" not found`);
    }

    return results[0]!;
  }

  /**
   * Update deployment config by type
   */
  async updateByType(type: ProviderType, data: Partial<DeploymentConfig>): Promise<PrimaryKey> {
    const deployment = await this.readByType(type);
    return this.updateOne(deployment.id, data);
  }

  /**
   * Delete deployment config by type
   */
  async deleteByType(type: ProviderType): Promise<PrimaryKey> {
    const deployment = await this.readByType(type);
    return this.deleteOne(deployment.id);
  }

  /**
   * Get a deployment driver instance with decrypted credentials
   *
   * @param type Provider type
   * @returns Configured deployment driver
   */
  async getDriver(type: ProviderType): Promise<DeploymentDriver> {
    // Use internal service with null accountability to get decrypted credentials
    const internalService = new ItemsService<DeploymentConfig>('directus_deployment', {
      knex: this.knex,
      schema: this.schema,
      accountability: null,
    });

    const results = await internalService.readByQuery({
      filter: { type: { _eq: type } },
      limit: 1,
    });

    if (!results || results.length === 0) {
      throw new Error(`Deployment config for "${type}" not found`);
    }

    const deployment = results[0]!;
    const credentials: Credentials = deployment.credentials ? JSON.parse(deployment.credentials) : {};
    const options: Options = deployment.options ?? {};

    return getDeploymentDriver(deployment.type, credentials, options);
  }

  /**
   * Test connection for a deployment config
   *
   * @param type Provider type
   */
  async testConnection(type: ProviderType): Promise<void> {
    const driver = await this.getDriver(type);
    await driver.testConnection();
  }
}

