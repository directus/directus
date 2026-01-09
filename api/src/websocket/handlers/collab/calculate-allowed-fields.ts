import type { Filter, Item, SchemaOverview } from '@directus/types';
import { generateFilterValidator } from '@directus/utils';

/**
 * Calculate the allowed fields for a collection based on processed permissions.
 */
export function calculateAllowedFields(
	collection: string,
	processedPermissions: any[],
	item: Item,
	schema: SchemaOverview,
): string[] {
	const allowedFields: string[] = [];

	for (const permission of processedPermissions) {
		const isMatch =
			!permission.permissions ||
			Object.keys(permission.permissions).length === 0 ||
			checkItemAccess(item, permission.permissions, collection, schema);

		if (isMatch && permission.fields) {
			allowedFields.push(...permission.fields);
		}
	}

	return Array.from(new Set(allowedFields)).filter(
		(field) => field === '*' || field in (schema.collections[collection]?.fields ?? {}),
	);
}

function checkItemAccess(item: Item, filter: Filter, collection: string, schema: SchemaOverview): boolean {
	const validator = generateFilterValidator(filter, collection, schema);

	const { error } = validator.validate(item);

	return error === undefined;
}
