import { toArray } from '@directus/shared/utils';
import env from '../env';

interface AuthProvider {
	name: string;
	driver: string;
}

export default (): AuthProvider[] | null => {
	if (!env.AUTH_PROVIDERS) {
		return null;
	}

	return toArray(env.AUTH_PROVIDERS)
		.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`])
		.map((provider) => ({
			name: provider,
			driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`],
		}));
};
