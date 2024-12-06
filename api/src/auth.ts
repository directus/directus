import { useEnv } from '@directus/env';
import { InvalidCredentialsError, InvalidProviderConfigError } from '@directus/errors';
import { toArray } from '@directus/utils';
import type { AuthDriver } from './auth/auth.js';
import {
	LDAPAuthDriver,
	LocalAuthDriver,
	OAuth2AuthDriver,
	OpenIDAuthDriver,
	SAMLAuthDriver,
} from './auth/drivers/index.js';
import { DEFAULT_AUTH_PROVIDER } from './constants.js';
import getDatabase from './database/index.js';
import { useLogger } from './logger/index.js';
import type { AuthDriverOptions } from './types/index.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { getSchema } from './utils/get-schema.js';

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
	const options = { knex: getDatabase(), schema: await getSchema() };

	const providerNames = toArray(env['AUTH_PROVIDERS'] as string);

	// Register default provider if not disabled
	if (!env['AUTH_DISABLE_DEFAULT']) {
		const defaultProvider = await getProviderInstance('local', options);

		if (!defaultProvider) {
			logger.error('Could not set default auth provider');
		} else {
			providers.set(DEFAULT_AUTH_PROVIDER, defaultProvider);
		}
	}

	if (!env['AUTH_PROVIDERS']) {
		return;
	}

	// Register configured providers
	providerNames.forEach(async (name: string) => {
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

		const provider = await getProviderInstance(driver, options, { provider: name, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			return;
		}

		providers.set(name, provider);
	});
}

async function getProviderInstance(
	driver: string,
	options: AuthDriverOptions,
	config: Record<string, any> = {},
): Promise<AuthDriver | undefined> {
	const logger = useLogger();

	switch (driver) {
		case 'local':
			return new LocalAuthDriver(options, config);

		case 'oauth2':
			return new OAuth2AuthDriver(options, config);

		case 'openid':
			return new OpenIDAuthDriver(options, config);

		case 'ldap':
			return new LDAPAuthDriver(options, config);

		case 'saml': {
			const samlAuthDriver = new SAMLAuthDriver(options, config);

			if (samlAuthDriver.idp === null) {
				await samlAuthDriver.setSAMLIdentityProviderMetadataFromUrl();

				if (samlAuthDriver.idp === null) {
					logger.error('[SAML] Setting up the IdentityProvider from metadata URL failed');
					throw new InvalidCredentialsError();
				}
			}

			return samlAuthDriver;
		}
	}

	return undefined;
}
