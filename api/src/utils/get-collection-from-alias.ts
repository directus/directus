import type { AliasMap } from './get-column-path.js';

/**
 * Extract the collection of an alias within an aliasMap
 * For example: 'ljnsv.name' -> 'authors'
 */
export function getCollectionFromAlias(alias: string, aliasMap: AliasMap): string | undefined {
	for (const aliasValue of Object.values(aliasMap)) {
		if (aliasValue.alias === alias) {
			return aliasValue.collection;
		}
	}

	return undefined;
}
