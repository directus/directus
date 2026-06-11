/**
 * sandbox option fixtures for the e2e suite.
 *
 */

import { randomUUID } from 'node:crypto';
import type { Options } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';
import { merge } from 'lodash-es';

export function withDefaultSandboxOptions(overrides?: DeepPartial<Options>): DeepPartial<Options> {
	const devMode = process.env['NODE_ENV'] === 'development';

	return merge(
		{
			dev: devMode,
			watch: devMode,
			prefix: database,
			docker: { keep: devMode },
			cache: false,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${randomUUID()}.db`,
			},
		},
		overrides,
	);
}
