import type { SchemaOverview } from '@directus/types';

export const templates: Record<string, string[]> = {
	cms: ['posts', 'pages'],
};

/**
 * Determine which templates have been applied to the project by checking
 * whether all expected collections for each template exist in the schema.
 */
export function getTemplatesApplied(schema: SchemaOverview): string[] {
	const collectionNames = new Set(Object.keys(schema.collections));

	return Object.entries(templates)
		.filter(([_key, requiredCollections]) => requiredCollections.every((c) => collectionNames.has(c)))
		.map(([key]) => key);
}
