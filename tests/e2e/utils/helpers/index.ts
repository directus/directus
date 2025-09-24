import { merge } from 'lodash-es';
import { maria } from './maria.js';
import { oracle } from './oracle.js';
import { cockroachdb } from './cockroachdb.js';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';

const helper = {
	integer: {
		min: -(2n ** 31n),
		max: 2n ** 31n - 1n,
	},
} as const;

export type Helper = typeof helper;
export type HelperOverrides = DeepPartial<typeof helper>;

export function getHelper(): Helper {
	return merge(
		helper,
		{
			maria,
			oracle,
			cockroachdb,
			mysql: {},
			postgres: {},
			sqlite: {},
			mssql: {},
		}[database],
	);
}
