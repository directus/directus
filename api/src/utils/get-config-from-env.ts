import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import camelcase from 'camelcase';
import { set } from 'lodash-es';

export interface GetConfigFromEnvOptions {
	omitPrefix?: string | string[];
	omitKey?: string | string[];
	type?: 'camelcase' | 'underscore';
}

/**
 * A placeholder used internally to distinguish `___` (triple-underscore) from `__` (double-underscore)
 * during env-var parsing. Triple underscore is an escape sequence that preserves a literal underscore
 * in the resulting config key. For example:
 *   DB_APPLICATION___NAME → connection.application_name  (not applicationName)
 * Double underscore creates nested objects:
 *   DB_CONNECTION__HOST → { connection: { host } }
 */
const TRIPLE_UNDERSCORE_PLACEHOLDER = '\u0000UNDERSCORE\u0000';

export function getConfigFromEnv(prefix: string, options?: GetConfigFromEnvOptions): Record<string, any> {
	const env = useEnv();
	const type = options?.type ?? 'camelcase';

	const config: any = {};

	const lowerCasePrefix = prefix.toLowerCase();
	const omitKeys = toArray(options?.omitKey ?? []).map((key) => key.toLowerCase());
	const omitPrefixes = toArray(options?.omitPrefix ?? []).map((prefix) => prefix.toLowerCase());

	for (const [key, value] of Object.entries(env)) {
		const lowerCaseKey = key.toLowerCase();
		if (lowerCaseKey.startsWith(lowerCasePrefix) === false) continue;

		if (omitKeys.length > 0) {
			const isKeyInOmitKeys = omitKeys.some((keyToOmit) => lowerCaseKey === keyToOmit);
			if (isKeyInOmitKeys) continue;
		}

		if (omitPrefixes.length > 0) {
			const keyStartsWithAnyPrefix = omitPrefixes.some((prefix) => lowerCaseKey.startsWith(prefix));

			if (keyStartsWithAnyPrefix) continue;
		}

		// Replace ___ before splitting on __ so that triple-underscores are not
		// accidentally consumed by the double-underscore path-nesting logic.
		const escapedKey = key.replace(/___/g, TRIPLE_UNDERSCORE_PLACEHOLDER);

		if (escapedKey.includes('__')) {
			const path = escapedKey
				.split('__')
				.map((part, index) =>
					index === 0
						? transform(transform(restoreUnderscores(part).slice(prefix.length)))
						: transform(restoreUnderscores(part)),
				);

			set(config, path.join('.'), value);
		} else {
			config[transform(restoreUnderscores(escapedKey).slice(prefix.length))] = value;
		}
	}

	return config;

	function restoreUnderscores(key: string): string {
		return key.replace(new RegExp(TRIPLE_UNDERSCORE_PLACEHOLDER, 'g'), '___');
	}

	function transform(key: string): string {
		if (type === 'camelcase') {
			// ___ in the key is an escape sequence for a literal underscore.
			// Split on ___, camelCase each segment, then join with _ to produce
			// a snake_case segment boundary (e.g. application___name → application_name).
			if (key.includes('___')) {
				return key
					.split('___')
					.map((part) => camelcase(part, { locale: false }))
					.join('_');
			}

			return camelcase(key, { locale: false });
		} else if (type === 'underscore') {
			return key.replace(/___/g, '_').toLowerCase();
		}

		return key;
	}
}
