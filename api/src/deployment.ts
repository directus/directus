import { ForbiddenError } from '@directus/errors';
import type { Credentials, DeploymentConfig, Options, ProviderType, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from './database/index.js';
import type { DeploymentDriver } from './deployment/deployment.js';
import {
	type CloudflareCredentials,
	CloudflareDriver,
	type CloudflareOptions,
	type NetlifyCredentials,
	NetlifyDriver,
	type NetlifyOptions,
	type VercelCredentials,
	VercelDriver,
	type VercelOptions,
} from './deployment/drivers/index.js';
import { useLogger } from './logger/index.js';
import { DeploymentService } from './services/deployment.js';
import { ItemsService } from './services/items.js';
import { getSchema } from './utils/get-schema.js';
import { parseValue } from './utils/parse-value.js';

type DriverConstructor = new (credentials: any, options?: any) => DeploymentDriver;

const drivers: Map<ProviderType, DriverConstructor> = new Map();

export function registerDeploymentDrivers(): void {
	drivers.set('vercel', VercelDriver);
	drivers.set('netlify', NetlifyDriver);
	drivers.set('cloudflare-workers', CloudflareDriver);
}

export function getDeploymentDriver(
	provider: ProviderType,
	credentials: Credentials,
	options?: Options,
): DeploymentDriver {
	switch (provider) {
		case 'vercel':
			return new VercelDriver(credentials as VercelCredentials, options as VercelOptions);
		case 'netlify':
			return new NetlifyDriver(credentials as NetlifyCredentials, options as NetlifyOptions);
		case 'cloudflare-workers':
			return new CloudflareDriver(credentials as CloudflareCredentials, options as CloudflareOptions);

		default: {
			const unsupported: never = provider;
			throw new ForbiddenError({ reason: `Deployment driver "${unsupported}" is not supported` });
		}
	}
}

export function getSupportedProviderTypes(): ProviderType[] {
	return Array.from(drivers.keys());
}

export function buildDriverFromConfig(config: DeploymentConfig): DeploymentDriver {
	const credentials = parseValue<Credentials>(config.credentials, {});
	const options = parseValue<Options>(config.options, {});

	return getDeploymentDriver(config.provider, credentials, options);
}

export async function readDeploymentConfig(
	knex: Knex,
	schema: SchemaOverview,
	provider: ProviderType,
): Promise<DeploymentConfig> {
	const internalService = new ItemsService<DeploymentConfig>('directus_deployments', {
		knex,
		schema,
		accountability: null, // bypass field redaction for encrypted credentials
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
