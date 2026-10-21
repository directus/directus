/**
 * sandbox option fixtures for the e2e suite.
 *
 */
import { type Database, type Options, type Sandbox, sandbox } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';

export function useSandbox(database: Database, options?: DeepPartial<Options>): Promise<Sandbox> {
	const devMode = process.env['NODE_ENV'] === 'development';
	const uid = getUID(1);

	options = merge(
		{
			dev: devMode,
			watch: devMode,
			docker: { keep: devMode, suffix: uid },
			cache: false,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${uid}.db`,
			},
		},
		options,
	);

	return sandbox(database, options);
}
