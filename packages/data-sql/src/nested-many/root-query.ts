import type { AbstractQuery } from '@directus/data';

// @ts-ignore
export function getRootQuery(query: AbstractQuery): AbstractQuery {
	const filteredField = query.fields.filter((fieldNode) => fieldNode.type !== 'nested-many');
	query.fields = filteredField;
	return query;
}
