import type { PrimaryKey } from '@directus/types';
import { isObject } from '@directus/utils';
import type { FkFieldInfo } from '../../utils/build-import-plan.js';

/** Clone an item, remap its scalar foreign keys through the id maps, and drop deferred fields. */
export function remapForeignKeys(
	item: Record<string, unknown>,
	fkFields: FkFieldInfo[],
	idMaps: Map<string, Map<string, PrimaryKey>>,
	secondPassFields: Set<string>,
): Record<string, unknown> {
	const payload: Record<string, unknown> = { ...item };

	// Fields resolved in the second pass (deferred FKs + o2m/m2m aliases) are dropped from the insert
	for (const field of secondPassFields) {
		delete payload[field];
	}

	for (const info of fkFields) {
		const value = payload[info.field];
		if (value === undefined || value === null || isObject(value)) continue;

		payload[info.field] = remapValue(value, resolveTarget(info, item), idMaps);
	}

	return payload;
}

/**
 * Map a foreign key value through the target collection's id map (identity when unmapped).
 */
export function remapValue(
	value: unknown,
	target: string | null,
	idMaps: Map<string, Map<string, PrimaryKey>>,
): unknown {
	if (value === null || value === undefined || !target) return value;

	if (Array.isArray(value)) {
		return value.map((entry) => remapValue(entry, target, idMaps));
	}

	const mapped = idMaps.get(target)?.get(String(value));
	return mapped !== undefined ? mapped : value;
}

/** Determine the target collection for a foreign key field (static for m2o, per-item for a2o). */
export function resolveTarget(info: FkFieldInfo, item: Record<string, unknown>): string | null {
	if (info.target) return info.target;
	if (!info.collectionField) return null;

	const target = item[info.collectionField];
	return typeof target === 'string' ? target : null;
}
