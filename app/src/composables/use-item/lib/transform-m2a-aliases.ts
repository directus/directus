import type { M2AAliasMap } from './get-graphql-query-fields';

/**
 * Transforms data returned from a GraphQL query with M2A aliased fields back to their original field names.
 *
 * When querying M2A (Many-to-Any) relations with collections that have fields with the same name but different
 * types, we use aliases (prefixed with collection name) to avoid GraphQL validation errors. This function
 * reverses that transformation on the response data.
 *
 * @param data - The data returned from GraphQL query (can be an item or array of items)
 * @param m2aAliasMap - Mapping of field paths to their alias configurations (includes collectionField and aliases per collection)
 * @returns The transformed data with original field names restored
 */
export function transformM2AAliases<T>(data: T, m2aAliasMap: M2AAliasMap): T {
	if (!data || Object.keys(m2aAliasMap).length === 0) {
		return data;
	}

	return transformItem(data, m2aAliasMap, null, null) as T;
}

function transformItem(
	item: unknown,
	m2aAliasMap: M2AAliasMap,
	fieldPath: string | null,
	parentCollection: string | null = null,
): unknown {
	if (item === null || item === undefined) {
		return item;
	}

	if (Array.isArray(item)) {
		// For arrays, pass the field path through so junction items know which config to use
		return item.map((element) => transformItem(element, m2aAliasMap, fieldPath, null));
	}

	if (typeof item !== 'object') {
		return item;
	}

	const obj = item as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	// If we have a field path, look up the config directly to avoid collisions
	// when multiple M2A fields share the same junction table/column
	let m2aConfig = fieldPath ? m2aAliasMap[fieldPath] : null;
	let effectiveFieldPath = fieldPath;

	// If no config found by path, we need to detect which M2A field this belongs to
	// Only scan if we don't have a field path (to avoid collisions when paths share same collectionField)
	if (!m2aConfig && !fieldPath) {
		// Check if this is a junction item (has a collectionField)
		// Find the matching config by checking all possible paths
		// This should only happen at the root level when we first encounter a junction item
		for (const [path, config] of Object.entries(m2aAliasMap)) {
			if (config.collectionField in obj) {
				m2aConfig = config;
				effectiveFieldPath = path;
				break;
			}
		}
	}

	// Get the collection value - either from this object (junction item) or from parent (nested item)
	const itemCollection = m2aConfig
		? ((obj[m2aConfig.collectionField] as string | undefined) ?? parentCollection)
		: undefined;

	const aliasesForCollection = m2aConfig && itemCollection ? m2aConfig.aliases[itemCollection] : undefined;

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

		// Determine the field path and collection for nested items
		let nextFieldPath: string | null = null;
		let nextParentCollection: string | null = null;

		if (effectiveFieldPath && m2aConfig) {
			// We're in an M2A context - pass the path through
			// Use the actual junction field name instead of hardcoding 'item'
			if (key === m2aConfig.junctionField) {
				// Entering the nested item - keep the same field path and pass the collection value
				nextFieldPath = effectiveFieldPath;
				nextParentCollection = itemCollection ?? null;
			} else {
				// Still in the junction item context - keep the same path
				nextFieldPath = effectiveFieldPath;
			}
		} else {
			// At root level - check if this key is an M2A field
			// Find the full path that starts with this key (e.g., "items2" -> "items2.item")
			const matchingPath = Object.keys(m2aAliasMap).find((path) => {
				const pathParts = path.split('.');
				return pathParts[0] === key;
			});

			if (matchingPath) {
				nextFieldPath = matchingPath;
			}
		}

		// Recursively transform nested objects/arrays
		if (typeof value === 'object' && value !== null) {
			newValue = transformItem(value, m2aAliasMap, nextFieldPath, nextParentCollection);
		}

		result[newKey] = newValue;
	}

	return result;
}
