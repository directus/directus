import type { DeepQuery, Filter, NestedDeepQuery, Query, SchemaOverview } from '@directus/types';
import { getRelation } from '@directus/utils';
import { getRelationType } from '../../../utils/get-relation-type.js';

export function filterReplaceM2A(
	filter_arg: Filter,
	collection: string,
	schema: SchemaOverview,
	options?: { aliasMap?: Query['alias'] },
): any {
	const filter: any = filter_arg;

	for (const key in filter) {
		const parts = key.split('__');
		let field = parts[0];
		const any_collection = parts[1];

		if (!field) continue;

		field = options?.aliasMap?.[field] ?? field;

		const relation = getRelation(schema.relations, collection, field);
		const type = relation ? getRelationType({ relation, collection, field }) : null;

		if (type === 'o2m' && relation) {
			filter[key] = filterReplaceM2A(filter[key], relation.collection, schema, options);
		} else if (type === 'm2o' && relation) {
			filter[key] = filterReplaceM2A(filter[key], relation.related_collection!, schema, options);
		} else if (
			type === 'a2o' &&
			relation &&
			any_collection &&
			relation.meta?.one_allowed_collections?.includes(any_collection)
		) {
			filter[`${field}:${any_collection}`] = filterReplaceM2A(filter[key], any_collection, schema, options);
			delete filter[key];
		} else if (Array.isArray(filter[key])) {
			filter[key] = filter[key].map((item) => filterReplaceM2A(item, collection, schema, options));
		} else if (typeof filter[key] === 'object') {
			filter[key] = filterReplaceM2A(filter[key], collection, schema, options);
		}
	}

	return filter;
}

export function filterReplaceM2ADeep(
	deep_arg: NestedDeepQuery | null | undefined,
	collection: string,
	schema: SchemaOverview,
	options?: { aliasMap?: Query['alias'] },
) {
	const deep: any = deep_arg;

	for (const key in deep) {
		if (key.startsWith('_') === false) {
			const parts = key.split('__');
			let field = parts[0];
			const any_collection = parts[1];

			if (!field) continue;

			field = options?.aliasMap?.[field] || (deep as DeepQuery)._alias?.[field] || field;

			const relation = getRelation(schema.relations, collection, field);

			if (!relation) continue;

			const type = getRelationType({ relation, collection, field });

			if (type === 'o2m') {
				deep[key] = filterReplaceM2ADeep(deep[key], relation.collection, schema);
			} else if (type === 'm2o') {
				deep[key] = filterReplaceM2ADeep(deep[key], relation.related_collection!, schema);
			} else if (type === 'a2o' && any_collection && relation.meta?.one_allowed_collections?.includes(any_collection)) {
				deep[`${field}:${any_collection}`] = filterReplaceM2ADeep(deep[key], any_collection, schema);
				delete deep[key];
			}
		}

		if (key === '_filter') {
			deep[key] = filterReplaceM2A(deep[key], collection, schema);
		}
	}

	return deep;
}
