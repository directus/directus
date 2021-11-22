import { toArray } from '@directus/shared/utils';
import env from '../env';

interface AuthProvider {
	name: string;
	driver: string;
	icon?: string;
}

export function getAuthProviders(): AuthProvider[] {
	return toArray(env.AUTH_PROVIDERS)
		.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`])
		.map((provider) => ({
			name: provider,
			driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`],
			icon: env[`AUTH_${provider.toUpperCase()}_ICON`],
		}));
}
