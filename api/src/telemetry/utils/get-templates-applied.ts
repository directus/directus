import type { SchemaOverview } from '@directus/types';
import { templates } from '../types/templates.js';

export function getTemplatesApplied(schema: SchemaOverview): string[] {
	const collectionNames = new Set(Object.keys(schema.collections));

	return Object.entries(templates)
		.filter(([_key, requiredCollections]) => requiredCollections.every((c) => collectionNames.has(c)))
		.map(([key]) => key);
}
