import { useEnv } from '@directus/env';
import { InvalidProviderConfigError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	CachedResult,
	Credentials,
	DeploymentConfig,
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

export class DeploymentService extends ItemsService<DeploymentConfig> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployments', options);
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
		const internalService = new ItemsService<DeploymentConfig>('directus_deployments', {
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
	 * Update deployment config with connection test
	 * @param provider Provider name
	 * @param newCredentials Optional new credentials
	 * @param newOptions Optional new options to merge (null values remove existing keys)
	 * @returns Primary key and merged credentials/options
	 */
	async updateWithConnectionTest(
		provider: ProviderType,
		newCredentials?: Credentials,
		newOptions?: Options,
	): Promise<{ primaryKey: PrimaryKey; credentials: Credentials; options: Options }> {
		// Read existing with decrypted credentials
		const deployment = await this.readConfig(provider);
		const existingCredentials = this.parseValue<Credentials>(deployment.credentials, {});
		const existingOptions = this.parseValue<Options>(deployment.options, {});

		const mergedCredentials = newCredentials ? { ...existingCredentials, ...newCredentials } : existingCredentials;

		const mergedOptions = newOptions
			? Object.fromEntries(Object.entries({ ...existingOptions, ...newOptions }).filter(([, v]) => v !== null))
			: existingOptions;

		const data: Partial<DeploymentConfig> = {};

		if (newCredentials) {
			data.credentials = JSON.stringify(mergedCredentials) as unknown as Credentials;
		}

		if (newOptions !== undefined) {
			data.options = JSON.stringify(mergedOptions) as unknown as Options;
		}

		const primaryKey = await this.updateByProvider(provider, data);

		// Test connection after permission check with merged values
		const driver = getDeploymentDriver(provider, mergedCredentials, mergedOptions);

		try {
			await driver.testConnection();
		} catch {
			throw new InvalidProviderConfigError({ provider, reason: 'Invalid API token' });
		}

		return { primaryKey, credentials: mergedCredentials, options: mergedOptions };
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
