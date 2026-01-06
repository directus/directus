import type { SchemaOverview } from '@directus/types';
import { filterItems } from '../../../utils/filter-items.js';

/**
 * Calculate the allowed fields for a collection based on processed permissions.
 */
export function calculateAllowedFields(
	collection: string,
	processedPermissions: any[],
	itemData: any,
	schema: SchemaOverview,
): string[] {
	const allowedFields: string[] = [];
	const itemArray = itemData ? [itemData] : [];

	for (const permission of processedPermissions) {
		const isMatch =
			!permission.permissions ||
			Object.keys(permission.permissions).length === 0 ||
			filterItems(itemArray, permission.permissions).length > 0;

		if (isMatch && permission.fields) {
			allowedFields.push(...permission.fields);
		}
	}

	return Array.from(new Set(allowedFields)).filter(
		(field) => field === '*' || field in (schema.collections[collection]?.fields ?? {}),
	);
}
