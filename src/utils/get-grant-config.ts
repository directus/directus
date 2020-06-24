/**
 * Reads the environment variables to construct the configuration object required by Grant
 */
export default function getGrantConfig() {
	const enabledProviders = process.env.OAUTH_PROVIDERS.split(',').map((provider) =>
		provider.trim()
	);

	const config: any = {
		defaults: {
			origin: process.env.PUBLIC_URL,
			transport: 'session',
			prefix: '/auth/sso',
			response: ['tokens', 'profile'],
		},
	};

	for (const [key, value] of Object.entries(process.env)) {
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
