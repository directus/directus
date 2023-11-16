import type { DeepPartial } from '@directus/types';
import decamelize from 'decamelize';
import { flatten } from 'flat';
import { mapKeys } from 'lodash-es';
import type { Theme } from '../schemas/index.js';

export const rulesToCssVars = (rules: DeepPartial<Theme['rules']>): Record<string, string | number> => {
	const flattened = flatten<DeepPartial<Theme['rules']>, Record<string, string | number>>(rules, { delimiter: '--' });

	const getRuleName = (name: string) => `--theme--${decamelize(name, { separator: '-' })}`;

	return mapKeys(flattened, (_value, key) => getRuleName(key));
};
