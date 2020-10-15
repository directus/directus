/**
 * Grant is the oAuth library
 */

import env from './env';

const enabledProviders = (env.OAUTH_PROVIDERS as string[]).map((provider) =>
	provider.toLowerCase()
);

const config: any = {
	defaults: {
		origin: env.PUBLIC_URL,
		transport: 'session',
		prefix: '/auth/oauth',
		response: ['tokens', 'profile'],
	},
};

for (const [key, value] of Object.entries(env)) {
	if (key.startsWith('OAUTH') === false) continue;

	const parts = key.split('_');
	const provider = parts[1].toLowerCase();

	if (enabledProviders.includes(provider) === false) continue;

	// OAUTH <PROVIDER> SETTING = VALUE
	parts.splice(0, 2);

	const configKey = parts.join('_').toLowerCase();

	config[provider] = {
		...(config[provider] || {}),
		[configKey]: value,
	};
}

export default config;
