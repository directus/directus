import { useEnv } from '@directus/env';
import { InvalidProviderConfigError } from '@directus/errors';
import { toArray, toBoolean } from '@directus/utils';
import type { AuthDriver } from './auth/auth.js';
import { LocalAuthDriver } from './auth/drivers/local.js';
import { DEFAULT_AUTH_PROVIDER } from './constants.js';
import getDatabase from './database/index.js';
import { getEntitlementManager } from './license/index.js';
import { useLogger } from './logger/index.js';
import type { AuthDriverOptions } from './types/index.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

const providers: Map<string, AuthDriver> = new Map();

export function getAuthProvider(provider: string): AuthDriver {
	const logger = useLogger();

	if (!providers.has(provider)) {
		logger.error('Auth provider not configured');
		throw new InvalidProviderConfigError({ provider });
	}

	return providers.get(provider)!;
}

export async function registerAuthProviders(): Promise<void> {
	const env = useEnv();
	const logger = useLogger();
	const options = { knex: getDatabase() };

	const providerNames = toArray(env['AUTH_PROVIDERS'] as string);

	const sso_allowed = getEntitlementManager().isEntitled('sso_enabled');

	if (sso_allowed === false && env['AUTH_PROVIDERS'] && providerNames.length > 0) {
		logger.warn('you have SSO providers configured these will be unavailable under the current license tier');
	}

	if (sso_allowed === false && toBoolean(env['AUTH_DISABLE_DEFAULT'])) {
		logger.warn('you cannot disable the default auth provider under the current license tier');
	}

	// Always register default provider
	const defaultProvider = (await getProviderInstance('local', options))!;
	providers.set(DEFAULT_AUTH_PROVIDER, defaultProvider);

	if (!env['AUTH_PROVIDERS']) {
		return;
	}

	// Register configured providers
	for (const name of providerNames) {
		name = name.trim();

		if (name === DEFAULT_AUTH_PROVIDER) {
			logger.error(`Cannot override "${DEFAULT_AUTH_PROVIDER}" auth provider.`);
			process.exit(1);
		}

		const { driver, ...config } = getConfigFromEnv(`AUTH_${name.toUpperCase()}_`);

		if (!driver) {
			logger.warn(`Missing driver definition for "${name}" auth provider.`);
			continue;
		}

		const provider = await getProviderInstance(driver, options, { provider: name, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			continue;
		}

		providers.set(name, provider);
	}
}

async function getProviderInstance(
	driver: string,
	options: AuthDriverOptions,
	config: Record<string, any> = {},
): Promise<AuthDriver | undefined> {
	switch (driver) {
		case 'local':
			return new LocalAuthDriver(options, config);

		case 'oauth2': {
			const { OAuth2AuthDriver } = await import('./auth/drivers/oauth2.js');
			return new OAuth2AuthDriver(options, config);
		}

		case 'openid': {
			const { OpenIDAuthDriver } = await import('./auth/drivers/openid.js');
			return new OpenIDAuthDriver(options, config);
		}

		case 'ldap': {
			const { LDAPAuthDriver } = await import('./auth/drivers/ldap.js');
			return new LDAPAuthDriver(options, config);
		}

		case 'saml': {
			const { SAMLAuthDriver } = await import('./auth/drivers/saml.js');
			return new SAMLAuthDriver(options, config);
		}
	}

	return undefined;
}
