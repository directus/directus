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

	return transformItem(data, m2aAliasMap, null) as T;
}

function transformItem(
	item: unknown,
	m2aAliasMap: M2AAliasMap,
	activeM2AConfig: {
		fieldPath: string;
		collectionField: string;
		aliases: Record<string, Record<string, string>>;
		collection?: string;
	} | null,
): unknown {
	if (item === null || item === undefined) {
		return item;
	}

	if (Array.isArray(item)) {
		return item.map((element) => transformItem(element, m2aAliasMap, activeM2AConfig));
	}

	if (typeof item !== 'object') {
		return item;
	}

	const obj = item as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	// Try to detect if this is a junction item by checking for collection fields from any M2A config
	let detectedM2AConfig: {
		fieldPath: string;
		collectionField: string;
		aliases: Record<string, Record<string, string>>;
		collection?: string;
	} | null = activeM2AConfig;

	if (!detectedM2AConfig) {
		// Check if this object has a collection field that matches any M2A config
		for (const [fieldPath, config] of Object.entries(m2aAliasMap)) {
			if (config.collectionField in obj) {
				detectedM2AConfig = { fieldPath, ...config };
				break;
			}
		}
	}

	// Get the collection value - either from this object or from the active config (for nested items)
	const itemCollection = detectedM2AConfig
		? ((obj[detectedM2AConfig.collectionField] as string | undefined) ?? detectedM2AConfig.collection)
		: undefined;

	const aliasesForCollection =
		detectedM2AConfig && itemCollection ? detectedM2AConfig.aliases[itemCollection] : undefined;

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

		// Determine the M2A config for nested items
		// If we're entering the 'item' field of a junction, we stay with the same config and pass the collection value
		// Otherwise, we clear it (not in an M2A context anymore)
		let nextM2AConfig: typeof activeM2AConfig = null;

		if (detectedM2AConfig && key === 'item') {
			// Entering the nested item - keep the same config and pass the collection value
			nextM2AConfig = { ...detectedM2AConfig, collection: itemCollection };
		} else if (detectedM2AConfig && key !== detectedM2AConfig.collectionField) {
			// Still in the same M2A context (junction item fields other than collection field)
			nextM2AConfig = detectedM2AConfig;
		}

		// Recursively transform nested objects/arrays
		if (typeof value === 'object' && value !== null) {
			newValue = transformItem(value, m2aAliasMap, nextM2AConfig);
		}

		result[newKey] = newValue;
	}

	return result;
}
