import type { SchemaOverview } from '@directus/types';
import { getRelations } from '@directus/utils';
import type { Knex } from 'knex';
import { getExcludedCollections } from '../../../../../utils/get-excluded-collections.js';
import type { FieldMap } from '../../types.js';
import { createFieldsForbiddenError } from './create-error.js';

const RELATIONAL_SPECIALS = new Set(['m2o', 'o2m', 'm2m', 'm2a']);

type RelationMetaRow = {
	many_collection: string;
	many_field: string;
	one_collection: string | null;
	one_field: string | null;
	one_allowed_collections: unknown;
};

function isRelationalField(schema: SchemaOverview, collection: string, field: string): boolean {
	const special = schema.collections[collection]?.fields[field]?.special;
	return special?.some((value) => RELATIONAL_SPECIALS.has(value)) ?? false;
}

function getCollectionsTouchedByFieldRelation(
	schema: SchemaOverview,
	collection: string,
	field: string,
	metaRows: RelationMetaRow[],
): Set<string> {
	const touched = new Set<string>();

	for (const relation of getRelations(schema.relations, collection, field)) {
		touched.add(relation.collection);

		if (relation.related_collection) {
			touched.add(relation.related_collection);
		}

		if (relation.meta?.one_allowed_collections) {
			for (const collection of relation.meta.one_allowed_collections) {
				touched.add(collection);
			}
		}
	}

	for (const row of metaRows) {
		const matchesManySide = row.many_collection === collection && row.many_field === field;
		const matchesOneSide = row.one_collection === collection && row.one_field === field;

		if (matchesManySide || matchesOneSide) {
			touched.add(row.many_collection);

			if (row.one_collection) {
				touched.add(row.one_collection);
			}

			if (Array.isArray(row.one_allowed_collections)) {
				for (const collection of row.one_allowed_collections) {
					if (typeof collection === 'string') {
						touched.add(collection);
					}
				}
			}
		}
	}

	return touched;
}

export async function validateExcludedRelations(fieldMap: FieldMap, schema: SchemaOverview, knex: Knex): Promise<void> {
	const excludedCollections = await getExcludedCollections(knex);

	if (excludedCollections.size === 0) {
		return;
	}

	const pairKeys = new Set<string>();

	for (const [, { collection, fields }] of [...fieldMap.read.entries(), ...fieldMap.other.entries()]) {
		for (const field of fields) {
			if (isRelationalField(schema, collection, field)) {
				pairKeys.add(`${collection}\x00${field}`);
			}
		}
	}

	const pairs = [...pairKeys].map((key) => {
		const separator = key.indexOf('\x00');
		return [key.slice(0, separator), key.slice(separator + 1)] as [string, string];
	});

	let relationMetaRows: RelationMetaRow[] = [];

	if (pairs.length > 0) {
		relationMetaRows = (await knex('directus_relations')
			.select('many_collection', 'many_field', 'one_collection', 'one_field', 'one_allowed_collections')
			.where((queryBuilder) => {
				for (const [collection, field] of pairs) {
					queryBuilder.orWhere((inner) => {
						inner.where({ many_collection: collection, many_field: field });
					});

					queryBuilder.orWhere((inner) => {
						inner.where({ one_collection: collection, one_field: field });
					});
				}
			})) as RelationMetaRow[];
	}

	for (const [path, { collection, fields }] of [...fieldMap.read.entries(), ...fieldMap.other.entries()]) {
		const invalidFields: string[] = [];
		const fieldMapKeys = [...fieldMap.read.keys(), ...fieldMap.other.keys()];

		for (const field of fields) {
			if (!isRelationalField(schema, collection, field)) continue;

			const nextPath = path ? `${path}.${field}` : field;

			const isTraversedRelation = fieldMapKeys.some(
				(key) => key === nextPath || key.startsWith(`${nextPath}.`) || key.startsWith(`${nextPath}:`),
			);

			const isScalarM2O = schema.collections[collection]?.fields[field]?.special?.includes('m2o') ?? false;

			if (!isTraversedRelation && isScalarM2O) {
				continue;
			}

			const touchedCollections = getCollectionsTouchedByFieldRelation(schema, collection, field, relationMetaRows);

			if (touchedCollections.size === 0) continue;

			if (
				[...touchedCollections].some(
					(touchedCollection) => touchedCollection !== collection && excludedCollections.has(touchedCollection),
				)
			) {
				invalidFields.push(field);
			}
		}

		if (invalidFields.length > 0) {
			throw createFieldsForbiddenError(path, collection, invalidFields);
		}
	}
}
