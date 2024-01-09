import { toArray, toBoolean } from '@directus/utils';
import { toNumber, toString } from 'lodash-es';
import { getTypeFromMap } from '../utils/get-type-from-map.js';
import { guessType } from '../utils/guess-type.js';
import { getCastFlag } from '../utils/has-cast-prefix.js';
import { tryJson } from '../utils/try-json.js';

export const cast = (key: string, value: unknown) => {
	const type = getCastFlag(value) ?? getTypeFromMap(key) ?? guessType(value);

	switch (type) {
		case 'string':
			return toString(value);
		case 'number':
			return toNumber(value);
		case 'boolean':
			return toBoolean(value);
		case 'regex':
			return new RegExp(String(value));
		case 'array':
			return toArray(value);
		case 'json':
			return tryJson(value);
	}
};
