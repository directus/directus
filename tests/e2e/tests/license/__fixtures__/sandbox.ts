/**
 * sandbox option fixtures for the e2e suite.
 *
 */
import type { Options } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { merge } from 'lodash-es';

export function withDefaultSandboxOptions(overrides?: DeepPartial<Options>): DeepPartial<Options> {
	const devMode = process.env['NODE_ENV'] === 'development';
	const uid = getUID(1);

	return merge(
		{
			dev: devMode,
			watch: devMode,
			prefix: database,
			docker: { keep: devMode, docker: { suffix: uid } },
			cache: false,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${uid}.db`,
			},
		},
		overrides,
	);
}
