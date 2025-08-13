import { Database } from '@directus/sandbox';
import { DeepPartial } from '../../../../packages/types/dist/misc';
import { merge } from 'lodash-es';
import { maria } from './maria';
import { oracle } from './oracle';
import { cockroachdb } from './cockroachdb';

const helper = {
	integer: {
		min: -(2n ** 31n),
		max: 2n ** 31n - 1n,
	},
} as const;

export type Helper = typeof helper;
export type HelperOverrides = DeepPartial<typeof helper>;

export function getHelper(database: Database): Helper {
	return merge(helper, { maria, oracle, cockroachdb }[database]);
}
