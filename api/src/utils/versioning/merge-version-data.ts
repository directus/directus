import type { Item } from '@directus/types';
import { cloneDeep } from 'lodash-es';

export function mergeVersionsRaw(item: Item, versionData: Partial<Item>[]) {
	const result = cloneDeep(item);

	for (const versionRecord of versionData) {
		for (const key of Object.keys(versionRecord)) {
			result[key] = versionRecord[key];
		}
	}

	return result;
}
