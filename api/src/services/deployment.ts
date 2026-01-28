import { useEnv } from '@directus/env';
import type {
	AbstractServiceOptions,
	CachedResult,
	Credentials,
	Options,
	PrimaryKey,
	Project,
	ProviderType,
	Query,
} from '@directus/types';
import { parseJSON } from '@directus/utils';
import { getCache, getCacheValueWithTTL, setCacheValueWithExpiry } from '../cache.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import { getDeploymentDriver } from '../deployment.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { ItemsService } from './items.js';

const env = useEnv();
const DEPLOYMENT_CACHE_TTL = getMilliseconds(env['DEPLOYMENT_CACHE_TTL']) || 5000; // Default 5s

export interface DeploymentConfig {
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
	 * Read deployment config with decrypted credentials (internal use)
	 */
	private async readConfig(provider: ProviderType): Promise<DeploymentConfig> {
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

		return results[0]!;
	}

	/**
	 * Parse JSON string or return value as-is
	 */
	private parseValue<T>(value: unknown, fallback: T): T {
		if (!value) return fallback;
		if (typeof value === 'string') return parseJSON(value);
		return value as T;
	}

	/**
	 * Get a deployment driver instance with decrypted credentials
	 */
	async getDriver(provider: ProviderType): Promise<DeploymentDriver> {
		const deployment = await this.readConfig(provider);
		const credentials = this.parseValue<Credentials>(deployment.credentials, {});
		const options = this.parseValue<Options>(deployment.options, {});

		return getDeploymentDriver(deployment.provider, credentials, options);
	}

	/**
	 * Test connection with optional credential/option overrides
	 * Merges provided values with existing config, filters out null values from options
	 *
	 * @param provider Provider name
	 * @param newCredentials Optional new credentials to test (uses existing if not provided)
	 * @param newOptions Optional new options to merge (null values remove existing keys)
	 * @returns Merged options after filtering nulls (for saving to DB)
	 */
	async testConnection(
		provider: ProviderType,
		newCredentials?: Credentials,
		newOptions?: Options,
	): Promise<{ credentials: Credentials; options: Options }> {
		const deployment = await this.readConfig(provider);
		const existingCredentials = this.parseValue<Credentials>(deployment.credentials, {});
		const existingOptions = this.parseValue<Options>(deployment.options, {});

		const credentials = newCredentials ?? existingCredentials;

		// Merge options and filter out null values (null means "delete this option")
		const mergedOptions = newOptions
			? Object.fromEntries(Object.entries({ ...existingOptions, ...newOptions }).filter(([, v]) => v !== null))
			: existingOptions;

		const driver = getDeploymentDriver(provider, credentials, mergedOptions);
		await driver.testConnection();

		return { credentials, options: mergedOptions };
	}

	/**
	 * List projects from provider with caching
	 */
	async listProviderProjects(provider: ProviderType): Promise<CachedResult<Project[]>> {
		const cacheKey = `${provider}:projects`;
		const { deploymentCache } = getCache();

		// Check cache first
		const cached = await getCacheValueWithTTL(deploymentCache, cacheKey);

		if (cached) {
			return { data: cached.data, remainingTTL: cached.remainingTTL };
		}

		// Fetch from driver
		const driver = await this.getDriver(provider);
		const projects = await driver.listProjects();

		// Store in cache
		await setCacheValueWithExpiry(deploymentCache, cacheKey, projects, DEPLOYMENT_CACHE_TTL);

		// Return with full TTL (just cached)
		return { data: projects, remainingTTL: DEPLOYMENT_CACHE_TTL };
	}

	/**
	 * Get project details from provider with caching
	 */
	async getProviderProject(provider: ProviderType, projectId: string): Promise<CachedResult<Project>> {
		const cacheKey = `${provider}:project:${projectId}`;
		const { deploymentCache } = getCache();

		// Check cache first
		const cached = await getCacheValueWithTTL(deploymentCache, cacheKey);

		if (cached) {
			return { data: cached.data, remainingTTL: cached.remainingTTL };
		}

		// Fetch from driver
		const driver = await this.getDriver(provider);
		const project = await driver.getProject(projectId);

		// Store in cache
		await setCacheValueWithExpiry(deploymentCache, cacheKey, project, DEPLOYMENT_CACHE_TTL);

		// Return with full TTL (just cached)
		return { data: project, remainingTTL: DEPLOYMENT_CACHE_TTL };
	}
}
