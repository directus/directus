import type { AbstractServiceOptions, Item, PrimaryKey, Query } from '@directus/types';
import { getDeploymentDriver } from '../deployment.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import type { Credentials, Options, ProviderType } from '../types/index.js';
import { ItemsService } from './items.js';

export interface DeploymentConfig extends Item {
	id: string;
	provider: ProviderType;
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
	 * Read deployment config by provider
	 */
	async readByProvider(provider: ProviderType, query?: Query): Promise<DeploymentConfig> {
		const results = await this.readByQuery({
			...query,
			filter: { provider: { _eq: provider } },
			limit: 1,
		});

		if (!results || results.length === 0) {
			throw new Error(`Deployment config for "${provider}" not found`);
		}

		return results[0]!;
	}

	/**
	 * Update deployment config by provider
	 */
	async updateByProvider(provider: ProviderType, data: Partial<DeploymentConfig>): Promise<PrimaryKey> {
		const deployment = await this.readByProvider(provider);
		return this.updateOne(deployment.id, data);
	}

	/**
	 * Delete deployment config by provider
	 */
	async deleteByProvider(provider: ProviderType): Promise<PrimaryKey> {
		const deployment = await this.readByProvider(provider);
		return this.deleteOne(deployment.id);
	}

	/**
	 * Get a deployment driver instance with decrypted credentials
	 *
	 * @param provider Provider name
	 * @returns Configured deployment driver
	 */
	async getDriver(provider: ProviderType): Promise<DeploymentDriver> {
		// Use internal service with null accountability to get decrypted credentials
		const internalService = new ItemsService<DeploymentConfig>('directus_deployment', {
			knex: this.knex,
			schema: this.schema,
			accountability: null,
		});

		const results = await internalService.readByQuery({
			filter: { provider: { _eq: provider } },
			limit: 1,
		});

		if (!results || results.length === 0) {
			throw new Error(`Deployment config for "${provider}" not found`);
		}

		const deployment = results[0]!;
		const credentials: Credentials = deployment.credentials ? JSON.parse(deployment.credentials) : {};
		const options: Options = deployment.options ?? {};

		return getDeploymentDriver(deployment.provider, credentials, options);
	}
}

