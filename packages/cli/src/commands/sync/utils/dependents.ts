import type { SystemCollection } from './system-collections.js';

/**
 * Grow a set of excluded source IDs until it is closed under foreign keys: a record pointing at an excluded
 * record cannot be sent either, or its FK would dangle. Iterates because self-referential chains (a folder
 * under a folder) deepen one level per pass. Mutates `excluded` in place.
 */
export function excludeDependents(system: readonly SystemCollection[], excluded: Map<string, Set<string>>): void {
	for (let changed = true; changed; ) {
		changed = false;

		for (const { data, resource } of system) {
			const fks = resource.fkFields;

			if (fks.length === 0) continue;

			const dropped = excluded.get(resource.collection) ?? new Set<string>();

			for (const record of data.records) {
				if (dropped.has(String(record[resource.primaryKey]))) continue;

				for (const fk of fks) {
					const value = record[fk.field];

					if (value === null || value === undefined) continue;
					if (excluded.get(fk.references)?.has(String(value)) !== true) continue;

					dropped.add(String(record[resource.primaryKey]));
					excluded.set(resource.collection, dropped);
					changed = true;
					break;
				}
			}
		}
	}
}

/** How many records a set of ambiguities holds back beyond the ambiguous records themselves. */
export function dependentCountOf(
	system: readonly SystemCollection[],
	ambiguities: readonly { collection: string; sourceId: string }[],
): number {
	const excluded = new Map<string, Set<string>>();

	for (const item of ambiguities) {
		const dropped = excluded.get(item.collection) ?? new Set<string>();
		dropped.add(item.sourceId);
		excluded.set(item.collection, dropped);
	}

	excludeDependents(system, excluded);

	let total = 0;
	for (const dropped of excluded.values()) total += dropped.size;

	return total - ambiguities.length;
}
