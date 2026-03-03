import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, SchemaOverview } from '@directus/types';
import { adjustDate } from '@directus/utils';

export const DYNAMIC_VARIABLE_MAP: Record<string, string> = {
	$CURRENT_USER: 'directus_users',
	$CURRENT_ROLE: 'directus_roles',
	$CURRENT_ROLES: 'directus_roles',
	$CURRENT_POLICIES: 'directus_policies',
};

/**
 * Calculate logical expiry (TTL) and dependencies for permissions caching.
 */
export function calculateCacheMetadata(
	collection: string,
	itemData: any,
	rawPermissions: any[],
	schema: SchemaOverview,
	accountability: Accountability,
): { ttlMs: number | undefined; dependencies: string[] } {
	let ttlMs: number | undefined;
	const dependencies = new Set<string>();

	if (itemData) {
		const now = Date.now();
		let closestExpiry = Infinity;

		// Scan permission filters for dynamic variables and relational dependencies to determine cache invalidation rules
		const scan = (val: unknown, fieldKey?: string, currentCollection: string = collection) => {
			if (!val || typeof val !== 'object') return;

			for (const [key, value] of Object.entries(val)) {
				// Parse dynamic variables
				if (typeof value === 'string' && value.startsWith('$')) {
					// $NOW requires calculating a logical expiry (TTL) based on the field value
					if (value.startsWith('$NOW')) {
						const field: string = fieldKey || key;
						const dateValue = itemData[field];

						if (dateValue) {
							let ruleDate = new Date();

							if (value.includes('(')) {
								const adjustment = value.match(REGEX_BETWEEN_PARENS)?.[1];
								if (adjustment) ruleDate = adjustDate(ruleDate, adjustment) || ruleDate;
							}

							const adjustmentMs = ruleDate.getTime() - now;
							const expiry = new Date(dateValue).getTime() - adjustmentMs;

							if (expiry > now && expiry < closestExpiry) {
								closestExpiry = expiry;
							}
						}
					} else {
						// Other dynamic variables ($CURRENT_USER, etc) create collection-based dependencies
						const parts = value.split('.');
						const dynamicVariable = parts[0]!;
						const rootCollection = DYNAMIC_VARIABLE_MAP[dynamicVariable];

						if (rootCollection) {
							// Only $CURRENT_USER needs granular tagging
							// Other dynamic variables trigger full cache wipe so collection-level is sufficient
							if (dynamicVariable === '$CURRENT_USER' && accountability.user) {
								dependencies.add(`${rootCollection}:${accountability.user}`);
							} else {
								dependencies.add(rootCollection);
							}

							// Track all intermediate collections in the path
							if (parts.length > 1) {
								let currentCollection: string | null = rootCollection;

								for (const segment of parts.slice(1, -1)) {
									if (!currentCollection) break;

									const relation = schema.relations.find(
										(r: any) =>
											(r.collection === currentCollection && r.field === segment) ||
											(r.related_collection === currentCollection && r.meta?.one_field === segment),
									);

									if (relation) {
										currentCollection =
											relation.collection === currentCollection
												? (relation.related_collection as string)
												: (relation.collection as string);

										if (currentCollection) dependencies.add(currentCollection);
									} else {
										currentCollection = null;
									}
								}
							}
						}
					}
				}

				// Parse relational filter dependencies to track which collections affect this permission
				let field = key;

				if (key.includes('(') && key.includes(')')) {
					const columnName = key.match(REGEX_BETWEEN_PARENS)?.[1];
					if (columnName) field = columnName;
				}

				if (!field.startsWith('_')) {
					const relation = schema.relations.find(
						(r: any) =>
							(r.collection === currentCollection && r.field === field) ||
							(r.related_collection === currentCollection && r.meta?.one_field === field),
					);

					let targetCol: string | null = null;

					if (relation) {
						targetCol = relation.collection === currentCollection ? relation.related_collection : relation.collection;
					}

					if (targetCol) {
						dependencies.add(targetCol);
						scan(value, undefined, targetCol);
					} else {
						// Not a relation, but might be a nested filter object
						scan(value, field.startsWith('_') ? fieldKey : field, currentCollection);
					}
				} else {
					// Keep scanning filter operators
					scan(value, fieldKey, currentCollection);
				}
			}
		};

		// Scan all raw permissions to collect dependencies and calculate TTL
		for (const permission of rawPermissions) {
			scan(permission.permissions);
		}

		if (closestExpiry !== Infinity) {
			ttlMs = closestExpiry - now;
			// Limit TTL to between 1s and 1 hour
			ttlMs = Math.max(1000, Math.min(ttlMs, 3600000));
		}
	}

	return { ttlMs, dependencies: Array.from(dependencies) };
}
