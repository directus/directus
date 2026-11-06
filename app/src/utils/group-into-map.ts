/**
 * Like lodash `groupBy`, but returns a Map. A plain object breaks on keys like "constructor", which are valid
 * collection names. An item lands under every key `getKeys` returns, once per distinct key.
 */
export function groupIntoMap<T>(items: readonly T[], getKeys: (item: T) => string | readonly string[]) {
	const groups = new Map<string, T[]>();

	for (const item of items) {
		const keys = getKeys(item);

		for (const key of typeof keys === 'string' ? [keys] : new Set(keys)) {
			const group = groups.get(key);

			if (group) group.push(item);
			else groups.set(key, [item]);
		}
	}

	return groups;
}
