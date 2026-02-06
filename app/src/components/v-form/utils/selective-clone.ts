import type { Field } from '@directus/types';
import { cloneDeep } from 'lodash';
import { markRaw } from 'vue';

/**
 * Checks if a field type is a geometry type.
 * Geometry types start with 'geometry' (e.g., 'geometry', 'geometry.Point', etc.)
 */
export function isGeometryType(type: string | undefined): boolean {
	return type?.startsWith('geometry') ?? false;
}

/**
 * Selectively clones form values, using deep cloning for regular fields
 * but marking geometry field values as raw to prevent Vue's deep reactivity
 * from traversing large coordinate arrays.
 *
 * This fixes performance issues when editing forms with large GeoJSON data.
 * See: https://github.com/directus/directus/issues/26475
 */
export function selectiveClone<T extends Record<string, any>>(
	values: T | null | undefined,
	fieldsMap: Record<string, Field | undefined>,
): T {
	if (!values) return {} as T;

	const result: Record<string, any> = {};

	for (const [key, value] of Object.entries(values)) {
		// Preserve $-prefixed metadata keys as-is
		if (key.startsWith('$')) {
			result[key] = value;
			continue;
		}

		// Skip null/undefined values
		if (value === null || value === undefined) {
			result[key] = value;
			continue;
		}

		const field = fieldsMap[key];
		const isGeometry = isGeometryType(field?.type);

		if (isGeometry && typeof value === 'object') {
			// Mark geometry values as raw to prevent deep reactivity
			result[key] = markRaw(cloneDeep(value));
		} else {
			// Deep clone regular values
			result[key] = cloneDeep(value);
		}
	}

	return result as T;
}
