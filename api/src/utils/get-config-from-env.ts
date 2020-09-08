import camelcase from 'camelcase';
import env from '../env';

export function getConfigFromEnv(prefix: string, omitPrefix?: string) {
	const config: any = {};

	for (const [key, value] of Object.entries(env)) {
		if (key.toLowerCase().startsWith(prefix.toLowerCase()) === false) continue;
		if (omitPrefix && key.toLowerCase().startsWith(omitPrefix.toLowerCase()) === true) continue;
		config[camelcase(key.slice(prefix.length))] = value;
	}

	return config;
}
