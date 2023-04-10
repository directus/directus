import { toArray } from '@directus/utils';
import env from '../env.js';

interface AuthProvider {
	label: string;
	name: string;
	driver: string;
	icon?: string;
}

export function getAuthProviders(): AuthProvider[] {
	return toArray(env['AUTH_PROVIDERS'])
		.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`])
		.map((provider) => ({
			name: provider,
			label: env[`AUTH_${provider.toUpperCase()}_LABEL`],
			driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`],
			icon: env[`AUTH_${provider.toUpperCase()}_ICON`],
		}));
}
