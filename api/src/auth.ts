import getDatabase from './database';
import env from './env';
import logger from './logger';
import Auth from './auth/auth';
import { LocalAuth } from './auth/drivers';
import { DEFAULT_AUTH_PROVIDER } from './constants';
import { InvalidConfigException } from './exceptions';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { toArray } from '@directus/shared/utils';

const providers: Map<string, Auth> = new Map();

export const getAuthProvider = (provider: string): Auth => {
	if (!providers.has(provider)) {
		throw new InvalidConfigException('Auth provider not configured', { provider });
	}
	return providers.get(provider) as Auth;
};

const registerProviders = (): void => {
	// Register default provider
	providers.set(DEFAULT_AUTH_PROVIDER, getProviderInstance('local', {}) as Auth);

	if (!env.AUTH_PROVIDERS) {
		return;
	}

	// Register configured providers
	const providerKeys = toArray(env.AUTH_PROVIDERS);

	if (providerKeys.includes(DEFAULT_AUTH_PROVIDER)) {
		logger.error(`Cannot override "${DEFAULT_AUTH_PROVIDER}" auth provider.`);
		process.exit(1);
	}

	providerKeys.forEach((key: string) => {
		key = key.trim();

		const { driver, ...config } = getConfigFromEnv(`AUTH_${key.toUpperCase()}_`);

		if (!driver) {
			logger.warn(`Missing driver definition for "${key}" auth provider.`);
			return;
		}

		const provider = getProviderInstance(driver, { provider: key, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			return;
		}

		providers.set(key, provider);
	});
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getProviderInstance = (driver: string, config: Record<string, any>): Auth | undefined => {
	switch (driver) {
		case 'local':
			return new LocalAuth(getDatabase());
	}
};

registerProviders();
