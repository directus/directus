import getDatabase from './database';
import env from './env';
import logger from './logger';
import { AuthDriver } from './auth/auth';
import { LocalAuthDriver, OAuth2AuthDriver, OpenIDAuthDriver, LDAPAuthDriver, SAMLAuthDriver } from './auth/drivers';

import { DEFAULT_AUTH_PROVIDER } from './constants';
import { InvalidConfigException } from './exceptions';
import { AuthDriverOptions } from './types';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { getSchema } from './utils/get-schema';
import { toArray } from '@directus/shared/utils';

const providerNames = toArray(env.AUTH_PROVIDERS);

const providers: Map<string, AuthDriver> = new Map();

export function getAuthProvider(provider: string): AuthDriver {
	if (!providers.has(provider)) {
		throw new InvalidConfigException('Auth provider not configured', { provider });
	}

	return providers.get(provider)!;
}

export async function registerAuthProviders(): Promise<void> {
	const options = { knex: getDatabase(), schema: await getSchema() };

	// Register default provider if not disabled
	if (!env.AUTH_DISABLE_DEFAULT) {
		const defaultProvider = getProviderInstance('local', options)!;
		providers.set(DEFAULT_AUTH_PROVIDER, defaultProvider);
	}

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

		const provider = getProviderInstance(driver, options, { provider: name, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			return;
		}

		providers.set(name, provider);
	});
}

function getProviderInstance(
	driver: string,
	options: AuthDriverOptions,
	config: Record<string, any> = {}
): AuthDriver | undefined {
	switch (driver) {
		case 'local':
			return new LocalAuthDriver(options, config);

		case 'oauth2':
			return new OAuth2AuthDriver(options, config);

		case 'openid':
			return new OpenIDAuthDriver(options, config);

		case 'ldap':
			return new LDAPAuthDriver(options, config);

		case 'saml':
			return new SAMLAuthDriver(options, config);
	}
}
