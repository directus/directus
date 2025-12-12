import type { M2AAliasMap } from './get-graphql-query-fields';

/**
 * Transforms data returned from a GraphQL query with M2A aliased fields back to their original field names.
 *
 * When querying M2A (Many-to-Any) relations with collections that have fields with the same name but different
 * types, we use aliases (prefixed with collection name) to avoid GraphQL validation errors. This function
 * reverses that transformation on the response data.
 *
 * @param data - The data returned from GraphQL query (can be an item or array of items)
 * @param m2aAliasMap - Mapping of collection names to their alias->original field name mappings
 * @param collectionField - The name of the field that indicates which collection an M2A item belongs to
 * @returns The transformed data with original field names restored
 */
export function transformM2AAliases<T>(data: T, m2aAliasMap: M2AAliasMap, collectionField: string = 'collection'): T {
	if (!data || Object.keys(m2aAliasMap).length === 0) {
		return data;
	}

	return transformItem(data, m2aAliasMap, collectionField, null) as T;
}

function transformItem(
	item: unknown,
	m2aAliasMap: M2AAliasMap,
	collectionField: string,
	parentCollection: string | null,
): unknown {
	if (item === null || item === undefined) {
		return item;
	}

	if (Array.isArray(item)) {
		return item.map((element) => transformItem(element, m2aAliasMap, collectionField, parentCollection));
	}

	if (typeof item !== 'object') {
		return item;
	}

	const obj = item as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	// Check if this object has a collection field indicating it's an M2A item or junction item
	const itemCollection = obj[collectionField] as string | undefined;

	// Determine which aliases to apply:
	// 1. If this object has a collection field, use that collection's aliases for this object AND its children
	// 2. If parentCollection is set (from ancestor), use that collection's aliases
	const effectiveCollection = itemCollection ?? parentCollection;
	const aliasesForCollection = effectiveCollection ? m2aAliasMap[effectiveCollection] : undefined;

	for (const [key, value] of Object.entries(obj)) {
		// Skip internal GraphQL fields
		if (key === '__typename') {
			continue;
		}

		let newKey = key;
		let newValue = value;

		// If we have aliases for the current collection context and this key is an alias, transform it back
		if (aliasesForCollection && key in aliasesForCollection) {
			newKey = aliasesForCollection[key]!;
		}

		// Recursively transform nested objects/arrays
		if (typeof value === 'object' && value !== null) {
			newValue = transformItem(value, m2aAliasMap, collectionField, effectiveCollection);
		}

		result[newKey] = newValue;
	}

	return result;
}
