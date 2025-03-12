import type { Filter, NestedDeepQuery, SchemaOverview } from '@directus/types';

export function filterReplaceM2A(filter_arg: Filter, collection: string, schema: SchemaOverview): any {
	const filter: any = filter_arg;

	for (const key in filter) {
		const o2m_relation = schema.relations.find(
			(relation) => relation.related_collection === collection && relation.meta?.one_field === key,
		);

		const m2o_relation = schema.relations.find(
			(relation) => relation.collection === collection && relation.field === key,
		);

		const a2o_relation = schema.relations.find(
			(relation) =>
				relation.collection === collection &&
				key.startsWith(relation.field + '__') &&
				relation.meta?.one_allowed_collections?.some((collection) => collection === key.split('__')[1]),
		);

		if (o2m_relation) {
			filter[key] = filterReplaceM2A(filter[key], o2m_relation.collection!, schema);
		} else if (m2o_relation) {
			filter[key] = filterReplaceM2A(filter[key], m2o_relation.related_collection!, schema);
		} else if (a2o_relation) {
			const new_key = key.replace('__', ':');
			filter[new_key] = filterReplaceM2A(filter[key], key.split('__')[1]!, schema);
			delete filter[key];
		} else if (Array.isArray(filter[key])) {
			filter[key] = filter[key].map((item) => filterReplaceM2A(item, collection, schema));
		} else if (typeof filter[key] === 'object') {
			filter[key] = filterReplaceM2A(filter[key], collection, schema);
		}
	}

	return filter;
}

export function filterReplaceM2ADeep(
	deep_arg: NestedDeepQuery | null | undefined,
	collection: string,
	schema: SchemaOverview,
) {
	if (!deep_arg) return deep_arg;

	const deep: any = deep_arg;

	for (const key in deep) {
		if (key.startsWith('_') === false) {
			const o2m_relation = schema.relations.find(
				(relation) => relation.related_collection === collection && relation.meta?.one_field === key,
			);

			const m2o_relation = schema.relations.find(
				(relation) => relation.collection === collection && relation.field === key,
			);

			const a2o_relation = schema.relations.find(
				(relation) =>
					relation.collection === collection &&
					key.startsWith(relation.field + '__') &&
					relation.meta?.one_allowed_collections?.some((collection) => collection === key.split('__')[1]),
			);

			if (o2m_relation) {
				deep[key] = filterReplaceM2ADeep(deep[key], o2m_relation.collection!, schema);
			} else if (m2o_relation) {
				deep[key] = filterReplaceM2ADeep(deep[key], m2o_relation.related_collection!, schema);
			} else if (a2o_relation) {
				deep[key] = filterReplaceM2ADeep(deep[key], key.split('__')[1]!, schema);
			}
		}

		if (key === '_filter') {
			deep[key] = filterReplaceM2A(deep[key], collection, schema);
		}
	}

	return deep;
}
