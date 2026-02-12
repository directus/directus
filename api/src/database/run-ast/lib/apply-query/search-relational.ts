import { RELATIONAL_TYPES } from '@directus/constants';
import type { FieldOverview, Permission, SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { applySearch } from './search.js';

export function applyRelationalSearch(
	knex: Knex,
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	searchQuery: string,
	collection: string,
	aliasMap: AliasMap,
	permissions: Permission[],
	fieldName: string,
	fieldOverview: FieldOverview,
	currentRelationalDepth = 1,
) {
	const primaryKey = schema.collections[collection]?.primary;

	if (!primaryKey) return;

	dbQuery.orWhereExists(function (subQuery) {
		const { relation } = getRelationInfo(schema.relations, collection, fieldName);

		if (!relation) return;

		subQuery
			.from(relation.collection)
			.andWhereRaw(`?? = ??`, [`${relation.collection}.${relation.field}`, `${collection}.${primaryKey}`])
			.andWhere(function (subSubQuery) {
				if (fieldOverview.special.includes('m2m') && relation.meta?.junction_field && relation.related_collection) {
					// subSubQuery
					// .from(relation.related_collection)
					// .whereRaw(`?? = ??`, [`${relation.related_collection}.${schema.collections[relation.related_collection]?.primary}`, `${relation.collection}.${relation.meta?.junction_field}`])
					// .andWhere(function (relatedSubQuery) {
					// 	addWhereConditions(knex, schema, relatedSubQuery, searchQuery, relation.related_collection!, aliasMap, permissions, maxRelationDepth, currentDepth + 1);
					// });
				} else {
					applySearch(
						knex,
						schema,
						subSubQuery,
						searchQuery,
						relation.collection,
						aliasMap,
						permissions,
						currentRelationalDepth + 1,
					);
				}
			});
	});
}

function isFieldRelational(field: FieldOverview): boolean {
	return RELATIONAL_TYPES.some((type) => field.special.includes(type));
}

export function shouldHandleRelationalSearch(
	field: FieldOverview,
	currentDepth: number,
	maxRelationDepth: number,
): boolean {
	return isFieldRelational(field) && currentDepth <= maxRelationDepth;
}
