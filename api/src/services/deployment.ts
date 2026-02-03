import { useEnv } from '@directus/env';
import { InvalidPayloadError, InvalidProviderConfigError } from '@directus/errors';
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
import { has, isEmpty, isString } from 'lodash-es';
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

	override async createOne(data: Partial<DeploymentConfig>, opts?: any): Promise<PrimaryKey> {
		const provider = data.provider as ProviderType | undefined;

		if (!provider) {
			throw new InvalidPayloadError({ reason: 'Provider is required' });
		}

		if (isEmpty(data.credentials)) {
			throw new InvalidPayloadError({ reason: 'Credentials are required' });
		}

		let credentials: Credentials;

		try {
			credentials = this.parseValue<Credentials>(data.credentials, {});
		} catch {
			throw new InvalidPayloadError({ reason: 'Credentials must be valid JSON' });
		}

		let options: Options | undefined;

		try {
			options = this.parseValue<Options | undefined>(data.options, undefined);
		} catch {
			throw new InvalidPayloadError({ reason: 'Options must be valid JSON' });
		}

		// Test connection before persisting
		const driver = getDeploymentDriver(provider, credentials, options);

		try {
			await driver.testConnection();
		} catch {
			throw new InvalidProviderConfigError({ provider, reason: 'Invalid config connection' });
		}

		const payload: Partial<DeploymentConfig> = {
			...data,
			// Persist as string so payload service encrypts the value
			credentials: JSON.stringify(credentials) as unknown as Credentials,
		};

		if (!isEmpty(options)) {
			payload.options = JSON.stringify(options) as unknown as Options;
		}

		return super.createOne(payload, opts);
	}

	override async updateOne(key: PrimaryKey, data: Partial<DeploymentConfig>, opts?: any): Promise<PrimaryKey> {
		const hasCredentials = has(data, 'credentials');
		const hasOptions = has(data, 'options');

		if (!hasCredentials && !hasOptions) {
			return super.updateOne(key, data, opts);
		}

		const existing = await this.readOne(key);
		const provider = existing.provider as ProviderType;

		const internal = await this.readConfig(provider);
		let credentials: Credentials = this.parseValue<Credentials>(internal.credentials, {});

		if (hasCredentials) {
			try {
				const parsed = this.parseValue<Credentials>(data.credentials, {});
				credentials = { ...credentials, ...parsed };
			} catch {
				throw new InvalidPayloadError({ reason: 'Credentials must be valid JSON or object' });
			}
		}

		let options: Options | undefined | null = existing.options ?? undefined;

		if (hasOptions) {
			try {
				options = this.parseValue<Options | undefined>(data.options, undefined);
			} catch {
				throw new InvalidPayloadError({ reason: 'Options must be valid JSON' });
			}

			if (isEmpty(options)) {
				throw new InvalidPayloadError({ reason: 'Options must not be empty' });
			}
		}

		// Test connection before persisting
		const driver = getDeploymentDriver(provider, credentials, options);

		try {
			await driver.testConnection();
		} catch {
			throw new InvalidProviderConfigError({ provider, reason: 'Invalid config connection' });
		}

		return super.updateOne(
			key,
			{
				credentials: JSON.stringify(credentials) as unknown as Credentials,
				...(!isEmpty(options) ? { options: JSON.stringify(options) as unknown as Options } : {}),
			},
			opts,
		);
	}

	/**
	 * Read deployment config by provider
	 */
	async readByProvider(provider: ProviderType, query?: Query): Promise<DeploymentConfig> {
		const providerFilter = { provider: { _eq: provider } };
		const filter = query?.filter ? { _and: [query.filter, providerFilter] } : providerFilter;

		const results = await this.readByQuery({
			...query,
			filter,
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
