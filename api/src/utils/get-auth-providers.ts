import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';

interface AuthProvider {
	name: string;
	driver: string;
	icon?: string;
	label?: string;
}

export function getAuthProviders(): AuthProvider[] {
	const env = useEnv();

	return toArray(env['AUTH_PROVIDERS'] as string)
		.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`])
		.map((provider) => ({
			name: provider,
			label: env[`AUTH_${provider.toUpperCase()}_LABEL`] as string,
			driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`] as string,
			icon: env[`AUTH_${provider.toUpperCase()}_ICON`] as string,
		}));
}

export function getSessionAuthProviders(): AuthProvider[] {
	const env = useEnv();

	return toArray(env['AUTH_PROVIDERS'] as string)
		.filter((provider) => {
			if (!provider) return false;
			const driver = env[`AUTH_${provider.toUpperCase()}_DRIVER`] as string;
			if (!driver) return false;

			if (['oauth2', 'openid', 'saml'].includes(driver)) {
				const mode = env[`AUTH_${provider.toUpperCase()}_MODE`] as string;
				return !mode || mode === 'session';
			}

			return true;
		})
		.map((provider) => ({
			name: provider,
			label: env[`AUTH_${provider.toUpperCase()}_LABEL`] as string,
			driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`] as string,
			icon: env[`AUTH_${provider.toUpperCase()}_ICON`] as string,
		}));
}
