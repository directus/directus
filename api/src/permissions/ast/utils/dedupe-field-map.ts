import { uniq } from 'lodash-es';
import type { FieldMap } from '../types.js';

export function dedupeFieldMap(fieldMap: FieldMap) {
	for (const [key, value] of Object.entries(fieldMap)) {
		fieldMap[key] = uniq(value);
	}
}
