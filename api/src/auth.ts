import { BasicAuth, AuthManager, AuthManagerConfig, AuthConstructor } from '@directus/auth';
import getDatabase from './database';
import env from './env';
import { DEFAULT_AUTH_PROVIDER } from './constants';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { toArray } from './utils/to-array';

const getAuthConfig = (): AuthManagerConfig => {
	const config: AuthManagerConfig = {
		default: DEFAULT_AUTH_PROVIDER,
		providers: {
			[DEFAULT_AUTH_PROVIDER]: {
				driver: 'basic',
				config: {},
			},
		},
	};

	if (env.AUTH_PROVIDERS) {
		const providers = toArray(env.AUTH_PROVIDERS);

		providers.forEach((provider: string) => {
			provider = provider.trim();

			const authConfig = {
				driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`],
				config: getConfigFromEnv(`AUTH_${provider.toUpperCase()}_`),
			};

			delete authConfig.config.driver;

			config.providers![provider] = authConfig;
		});
	}

	return config;
};

const registerDrivers = (manager: AuthManager): void => {
	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(env)) {
		if ((key.startsWith('AUTH') && key.endsWith('DRIVER')) === false) continue;
		if (value && usedDrivers.includes(value) === false) usedDrivers.push(value);
	}

	usedDrivers.forEach((driver) => {
		const authDriver = getAuthDriver(driver);

		if (authDriver) {
			manager.registerDriver(driver, authDriver);
		}
	});
};

const getAuthDriver = (driver: string): AuthConstructor | undefined => {
	switch (driver) {
		case 'basic':
			return BasicAuth;
	}
};

const auth = new AuthManager(getDatabase(), getAuthConfig());

registerDrivers(auth);

export default auth;
