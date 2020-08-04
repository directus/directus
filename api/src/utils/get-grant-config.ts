import env from '../env';

/**
 * Reads the environment variables to construct the configuration object required by Grant
 */
export default function getGrantConfig() {
	const enabledProviders = (env.OAUTH_PROVIDERS as string)
		.split(',')
		.map((provider) => provider.trim());

	const config: any = {
		defaults: {
			origin: env.PUBLIC_URL,
			transport: 'session',
			prefix: '/auth/sso',
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

	return config;
}
