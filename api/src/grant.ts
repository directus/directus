/**
 * Grant is the oAuth library
 */

import env from './env';
import { toArray } from './utils/to-array';
import { getConfigFromEnv } from './utils/get-config-from-env';

const enabledProviders = toArray(env.OAUTH_PROVIDERS).map((provider) => provider.toLowerCase());

const config: any = {
	defaults: {
		origin: env.PUBLIC_URL,
		transport: 'session',
		prefix: '/auth/oauth',
		response: ['tokens', 'profile'],
	},
};

for (const provider of enabledProviders) {
	config[provider] = getConfigFromEnv(`OAUTH_${provider.toUpperCase()}_`, undefined, 'underscore');
}

export default config;
