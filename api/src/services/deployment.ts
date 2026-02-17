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
import { mergeFilters, parseJSON } from '@directus/utils';
import { has, isEmpty } from 'lodash-es';
import { getCache, getCacheValueWithTTL, setCacheValueWithExpiry } from '../cache.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import { getDeploymentDriver } from '../deployment.js';
import { useLogger } from '../logger/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import type { DeploymentProject } from './deployment-projects.js';
import { ItemsService } from './items.js';

const env = useEnv();
const DEPLOYMENT_CACHE_TTL = getMilliseconds(env['CACHE_DEPLOYMENT_TTL']) || 5000; // Default 5s

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
		const results = await this.readByQuery({
			...query,
			filter: mergeFilters({ provider: { _eq: provider } }, query?.filter ?? null),
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

		// Webhook cleanup
		if (deployment.webhook_ids && deployment.webhook_ids.length > 0) {
			try {
				const driver = await this.getDriver(provider);
				await driver.unregisterWebhook(deployment.webhook_ids);
			} catch (err) {
				const logger = useLogger();
				logger.error(`Failed to unregister webhook for ${provider}: ${err}`);
			}
		}

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
	 * Get webhook config for a provider (internal use by webhook controller)
	 */
	async getWebhookConfig(
		provider: ProviderType,
	): Promise<{ webhook_secret: string | null; credentials: Credentials; options: Options }> {
		const config = await this.readConfig(provider);

		return {
			webhook_secret: config.webhook_secret ?? null,
			credentials: this.parseValue<Credentials>(config.credentials, {}),
			options: this.parseValue<Options>(config.options, {}),
		};
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
	 * Sync webhook registration with current tracked projects.
	 * Registers, re-registers, or unregisters as needed.
	 */
	async syncWebhook(provider: ProviderType): Promise<void> {
		const logger = useLogger();

		logger.debug(`[webhook:${provider}] Starting webhook sync`);

		const config = await this.readConfig(provider);

		const projectsService = new ItemsService<DeploymentProject>('directus_deployment_projects', {
			knex: this.knex,
			schema: this.schema,
			accountability: null,
		});

		const projects = await projectsService.readByQuery({
			filter: { deployment: { _eq: config.id } },
			limit: -1,
		});

		const projectExternalIds = projects.map((p) => p.external_id);
		const driver = await this.getDriver(provider);

		// No projects → unregister webhooks if any exist
		if (projectExternalIds.length === 0) {
			if (config.webhook_ids && config.webhook_ids.length > 0) {
				logger.debug(`[webhook:${provider}] No projects, unregistering ${config.webhook_ids.length} webhook(s)`);

				try {
					await driver.unregisterWebhook(config.webhook_ids);
				} catch (err) {
					logger.warn(`[webhook:${provider}] Failed to unregister: ${err}`);
				}

				await super.updateOne(config.id, { webhook_ids: null, webhook_secret: null } as Partial<DeploymentConfig>);
			}

			return;
		}

		// Unregister existing webhooks before re-registering
		if (config.webhook_ids && config.webhook_ids.length > 0) {
			logger.debug(`[webhook:${provider}] Unregistering ${config.webhook_ids.length} existing webhook(s)`);

			try {
				await driver.unregisterWebhook(config.webhook_ids);
			} catch (err) {
				logger.warn(`[webhook:${provider}] Failed to unregister: ${err}`);
			}
		}

		const publicUrl = env['PUBLIC_URL'] as string;
		const webhookUrl = `${publicUrl}/deployments/webhooks/${provider}`;

		logger.debug(
			`[webhook:${provider}] Registering webhook → ${webhookUrl} for ${projectExternalIds.length} project(s)`,
		);

		const result = await driver.registerWebhook(webhookUrl, projectExternalIds);

		await super.updateOne(config.id, {
			webhook_ids: result.webhook_ids,
			webhook_secret: result.webhook_secret,
		} as Partial<DeploymentConfig>);

		logger.info(
			`[webhook:${provider}] Registered ${result.webhook_ids.length} webhook(s): [${result.webhook_ids.join(', ')}]`,
		);
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
