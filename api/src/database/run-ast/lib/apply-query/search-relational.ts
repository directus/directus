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

		let targetCollection = relation.collection;

		if (fieldOverview.special.includes('m2m')) {
			if (!relation.meta?.junction_field) return;

			const { relation: targetRelation } = getRelationInfo(
				schema.relations,
				relation.collection,
				relation.meta.junction_field,
			);

			if (!targetRelation?.related_collection) return;

			const targetPk = schema.collections[targetRelation.related_collection]?.primary;
			const junctionField = relation.meta.junction_field;

			if (!targetPk) return;

			subQuery
				.from(targetRelation.related_collection)
				.whereIn(`${targetRelation.related_collection}.${targetPk}`, function (query) {
					query
						.select(`${relation.collection}.${junctionField}`)
						.from(relation.collection)
						.whereRaw(`?? = ??`, [`${relation.collection}.${relation.field}`, `${collection}.${primaryKey}`]);
				});

			targetCollection = targetRelation.related_collection;
		} else {
			subQuery
				.from(relation.collection)
				.andWhereRaw(`?? = ??`, [`${relation.collection}.${relation.field}`, `${collection}.${primaryKey}`]);
		}

		subQuery.andWhere(function (subSubQuery) {
			applySearch(
				knex,
				schema,
				subSubQuery,
				searchQuery,
				targetCollection,
				aliasMap,
				permissions,
				currentRelationalDepth + 1,
			);
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
	return currentDepth <= maxRelationDepth && isFieldRelational(field);
}
