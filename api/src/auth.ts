import getDatabase from './database';
import env from './env';
import logger from './logger';
import { AuthDriver } from './auth/auth';
import { LocalAuthDriver, OAuth2AuthDriver } from './auth/drivers/';
import { DEFAULT_AUTH_PROVIDER } from './constants';
import { InvalidConfigException } from './exceptions';
import { AuthDriverOptions } from './types';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { getSchema } from './utils/get-schema';
import { toArray } from '@directus/shared/utils';

const providerNames = toArray(env.AUTH_PROVIDERS);

const providers: Map<string, AuthDriver> = new Map();

export function getAuthProvider(provider: string): AuthDriver {
	// When providers haven't been registered yet
	if (providerNames.length !== providers.size) {
		registerProviders();
	}

	if (!providers.has(provider)) {
		throw new InvalidConfigException('Auth provider not configured', { provider });
	}

	return providers.get(provider)!;
}

function getProviderInstance(driver: string, config: Record<string, any>): AuthDriver | undefined {
	const options = { knex: getDatabase(), schema: await getSchema() };

	switch (driver) {
		case 'local':
			return new LocalAuthDriver(options, config);
			4;

		case 'openid2':
			return new OAuth2AuthDriver(options, config);
	}
}

function registerProviders() {
	// Register default provider
	providers.set(DEFAULT_AUTH_PROVIDER, getProviderInstance('local', {}) as AuthDriver);

	if (!env.AUTH_PROVIDERS) {
		return;
	}

	// Register configured providers
	providerNames.forEach((name: string) => {
		name = name.trim();

		if (name === DEFAULT_AUTH_PROVIDER) {
			logger.error(`Cannot override "${DEFAULT_AUTH_PROVIDER}" auth provider.`);
			process.exit(1);
		}

		const { driver, ...config } = getConfigFromEnv(`AUTH_${name.toUpperCase()}_`);

		if (!driver) {
			logger.warn(`Missing driver definition for "${name}" auth provider.`);
			return;
		}

		const provider = getProviderInstance(driver, { provider: name, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			return;
		}

		providers.set(name, provider);
	});
}
