import { ForbiddenError } from '@directus/errors';
import type { Credentials, DeploymentConfig, Options, ProviderType, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from './database/index.js';
import type { DeploymentDriver } from './deployment/deployment.js';
import { CloudflareDriver, NetlifyDriver, VercelDriver } from './deployment/drivers/index.js';
import { useLogger } from './logger/index.js';
import { DeploymentService } from './services/deployment.js';
import { ItemsService } from './services/items.js';
import { getSchema } from './utils/get-schema.js';
import { parseValue } from './utils/parse-value.js';

// Driver constructor type — `any` for credentials/options so provider-specific subclasses (e.g. required CloudflareOptions) are assignable
type DriverConstructor = new (credentials: any, options?: any) => DeploymentDriver;

/**
 * Registry of deployment driver constructors
 */
const drivers: Map<ProviderType, DriverConstructor> = new Map();

/**
 * Register all deployment drivers
 */
export function registerDeploymentDrivers(): void {
	drivers.set('vercel', VercelDriver);
	drivers.set('netlify', NetlifyDriver);
	drivers.set('cloudflare-workers', CloudflareDriver);
}

/**
 * Get a deployment driver instance
 *
 * @param provider Provider name (vercel, netlify, aws, etc.)
 * @param credentials Provider credentials (decrypted from DB)
 * @param options Additional provider options
 * @returns Deployment driver instance
 * @throws ForbiddenError if provider is not supported
 */
export function getDeploymentDriver(
	provider: ProviderType,
	credentials: Credentials,
	options?: Options,
): DeploymentDriver {
	const Driver = drivers.get(provider);

	if (!Driver) {
		throw new ForbiddenError({ reason: `Deployment driver "${provider}" is not supported` });
	}

	return new Driver(credentials, options);
}

/**
 * Get list of supported provider types
 */
export function getSupportedProviderTypes(): ProviderType[] {
	return Array.from(drivers.keys());
}

export function buildDriverFromConfig(config: DeploymentConfig): DeploymentDriver {
	const credentials = parseValue<Credentials>(config.credentials, {});
	const options = parseValue<Options>(config.options, {});

	return getDeploymentDriver(config.provider, credentials, options);
}

/** Internal read with null accountability so encrypted credentials are decrypted, not redacted. */
export async function readDeploymentConfig(
	knex: Knex,
	schema: SchemaOverview,
	provider: ProviderType,
): Promise<DeploymentConfig> {
	const internalService = new ItemsService<DeploymentConfig>('directus_deployments', {
		knex,
		schema,
		accountability: null,
	});

	const results = await internalService.readByQuery({
		filter: { provider: { _eq: provider } },
		limit: 1,
	});

	if (!results || results.length === 0) {
		throw new ForbiddenError({ reason: `Deployment config for "${provider}" not found` });
	}

	return results[0]!;
}

/**
 * Sync webhooks for existing deployment configs that don't have one yet.
 * Called at startup to handle configs created before webhook support was added.
 */
export async function ensureDeploymentWebhooks(): Promise<void> {
	const logger = useLogger();
	const knex = getDatabase();
	const schema = await getSchema();

	const service = new DeploymentService({
		knex,
		schema,
		accountability: null,
	});

	const configs = await service.readByQuery({
		limit: -1,
	});

	if (!configs || configs.length === 0) {
		logger.debug('[webhook] No deployment configs found');
		return;
	}

	logger.debug(`[webhook] Syncing webhooks for ${configs.length} config(s)...`);

	for (const config of configs) {
		try {
			await service.syncWebhook(config.provider);
		} catch (error) {
			logger.error(error, `[webhook:${config.provider}] Failed to sync webhook`);
		}
	}
}
