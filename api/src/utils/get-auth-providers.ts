import { useEnv } from '@directus/env';

interface AuthProvider {
	name: string;
	driver: string;
	icon?: string;
	label?: string;
}

export function getAuthProviders({ sessionOnly } = { sessionOnly: false }): AuthProvider[] {
	const env = useEnv();

	let providers = env.AUTH_PROVIDERS.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`]);

	if (sessionOnly) {
		providers = providers.filter((provider) => {
			const driver = env[`AUTH_${provider.toUpperCase()}_DRIVER`] as string;

			// only the following 3 drivers require a mode selection
			if (['oauth2', 'openid', 'saml'].includes(driver)) {
				const mode = env[`AUTH_${provider.toUpperCase()}_MODE`] as string | undefined;
				// if mode is not defined it defaults to session
				return !mode || mode === 'session';
			}

			return true;
		});
	}

	return providers.map((provider) => ({
		name: provider,
		label: env[`AUTH_${provider.toUpperCase()}_LABEL`] as string,
		driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`] as string,
		icon: env[`AUTH_${provider.toUpperCase()}_ICON`] as string,
	}));
}
