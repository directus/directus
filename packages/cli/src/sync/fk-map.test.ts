import { systemRelationRows } from '@directus/system-data';
import { describe, expect, it } from 'vitest';
import { SYSTEM_FK_FIELDS } from './fk-map.js';
import { allResources } from './resources.js';

// SYSTEM_FK_FIELDS is hand-maintained from packages/system-data relations.yaml; these pins turn that
// claim into a checked one, against the same rows the server ships.
describe('SYSTEM_FK_FIELDS drift pin', () => {
	const synced = new Map(allResources().map((resource) => [resource.collection, resource]));

	function edge(collection: string, field: string, references: string): string {
		return `${collection}.${field} → ${references}`;
	}

	it('lists only foreign keys the server actually declares', () => {
		// A phantom entry would "remap" a field the server treats as plain data.
		const declared = new Set(
			systemRelationRows
				.filter((row) => typeof row.one_collection === 'string')
				.map((row) => edge(row.many_collection, row.many_field, row.one_collection as string)),
		);

		const phantom = Object.entries(SYSTEM_FK_FIELDS).flatMap(([collection, fks]) =>
			fks.map((fk) => edge(collection, fk.field, fk.references)).filter((entry) => !declared.has(entry)),
		);

		expect(phantom).toEqual([]);
	});

	it('lists every export-surviving foreign key between synced collections', () => {
		// A missing entry is the dangerous direction: the field ships in the export but import remaps
		// nothing, so raw source IDs land on the target. Stripped and aliased fields never reach disk,
		// so they are the only exemptions.
		const known = new Set(
			Object.entries(SYSTEM_FK_FIELDS).flatMap(([collection, fks]) =>
				fks.map((fk) => edge(collection, fk.field, fk.references)),
			),
		);

		const missing = systemRelationRows
			.filter((row) => {
				const owner = synced.get(row.many_collection);

				if (owner === undefined || typeof row.one_collection !== 'string' || !synced.has(row.one_collection)) {
					return false;
				}

				return !owner.strip.includes(row.many_field) && !owner.aliases.includes(row.many_field);
			})
			.map((row) => edge(row.many_collection, row.many_field, row.one_collection as string))
			.filter((entry) => !known.has(entry));

		expect(missing).toEqual([]);
	});
});
