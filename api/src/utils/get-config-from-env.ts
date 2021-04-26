import camelcase from 'camelcase';
import env from '../env';
import { set } from 'lodash';

export function getConfigFromEnv(prefix: string, omitPrefix?: string | string[]): any {
	const config: any = {};

	for (const [key, value] of Object.entries(env)) {
		if (key.toLowerCase().startsWith(prefix.toLowerCase()) === false) continue;

		if (omitPrefix) {
			let matches = false;

			if (Array.isArray(omitPrefix)) {
				matches = omitPrefix.some((prefix) => key.toLowerCase().startsWith(prefix.toLowerCase()));
			} else {
				matches = key.toLowerCase().startsWith(omitPrefix.toLowerCase());
			}

			if (matches) continue;
		}

		if (key.includes('__')) {
			const path = key
				.split('__')
				.map((key, index) => (index === 0 ? camelcase(camelcase(key.slice(prefix.length))) : camelcase(key)));
			set(config, path.join('.'), value);
		} else {
			config[camelcase(key.slice(prefix.length))] = value;
		}
	}

	return config;
}
