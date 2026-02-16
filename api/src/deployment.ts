import type { Credentials, Options, ProviderType } from '@directus/types';
import getDatabase from './database/index.js';
import type { DeploymentDriver } from './deployment/deployment.js';
import { NetlifyDriver, VercelDriver } from './deployment/drivers/index.js';
import { useLogger } from './logger/index.js';
import { DeploymentService } from './services/deployment.js';
import { getSchema } from './utils/get-schema.js';

// Driver constructor type - uses any for credentials to allow provider-specific types
type DriverConstructor = new (credentials: any, options?: Options) => DeploymentDriver;

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
}

/**
 * Get a deployment driver instance
 *
 * @param provider Provider name (vercel, netlify, aws, etc.)
 * @param credentials Provider credentials (decrypted from DB)
 * @param options Additional provider options
 * @returns Deployment driver instance
 * @throws Error if provider is not supported
 */
export function getDeploymentDriver(
	provider: ProviderType,
	credentials: Credentials,
	options?: Options,
): DeploymentDriver {
	const Driver = drivers.get(provider);

	if (!Driver) {
		throw new Error(`Deployment driver "${provider}" is not supported`);
	}

	return new Driver(credentials, options);
}

/**
 * Check if a provider is supported
 */
export function isValidProviderType(provider: string): provider is ProviderType {
	return drivers.has(provider as ProviderType);
}

/**
 * Get list of supported provider types
 */
export function getSupportedProviderTypes(): ProviderType[] {
	return Array.from(drivers.keys());
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
		filter: { webhook_ids: { _null: true } },
		limit: -1,
	});

	if (!configs || configs.length === 0) return;

	for (const config of configs) {
		try {
			await service.syncWebhook(config.provider);
		} catch (err) {
			logger.error(`Failed to sync webhook for ${config.provider}: ${err}`);
		}
	}
}
