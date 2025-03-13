import { useEnv } from '@directus/env';
import camelcase from 'camelcase';
import { set } from 'lodash-es';

export interface GetConfigFromEnvOptions {
	omitPrefix?: string | string[];
	omitKey?: string | string[];
	type?: 'camelcase' | 'underscore';
}

export function getConfigFromEnv(
	prefix: string,
	{ omitPrefix, omitKey, type = 'camelcase' }?: GetConfigFromEnvOptions = {},
): Record<string, any> {
	const env = useEnv();

	const config: any = {};

	const lowerCasePrefix = prefix.toLowerCase();

	for (const [key, value] of Object.entries(env)) {
		const lowerCaseKey = key.toLowerCase();
		if (lowerCaseKey.startsWith(lowerCasePrefix) === false) continue;

		if (omitKey) {
			const omitKeyArray = Array.isArray(omitKey) ? omitKey : [omitKey];
			const isKeyInOmitKeys = omitKeyArray.some((keyToOmit) => lowerCaseKey === keyToOmit.toLowerCase());
			if (isKeyInOmitKeys) continue;
		}

		if (omitPrefix) {
			const omitPrefixArray = Array.isArray(omitPrefix) ? omitPrefix : [omitPrefix];
			const keyStartsWithAnyPrefix = omitPrefixArray.some((prefix) => lowerCaseKey.startsWith(prefix.toLowerCase()));
			if (keyStartsWithAnyPrefix) continue;
		}

		if (key.includes('__')) {
			const path = key
				.split('__')
				.map((key, index) => (index === 0 ? transform(transform(key.slice(prefix.length))) : transform(key)));

			set(config, path.join('.'), value);
		} else {
			config[transform(key.slice(prefix.length))] = value;
		}
	}

	return config;

	function transform(key: string): string {
		if (type === 'camelcase') {
			return camelcase(key, { locale: false });
		} else if (type === 'underscore') {
			return key.toLowerCase();
		}

		return key;
	}
}
