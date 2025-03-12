import type { Accountability, Aggregate, Query, SchemaOverview } from '@directus/types';
import type { FieldNode, SelectionNode } from 'graphql';
import { sanitizeQuery } from '../../../utils/sanitize-query.js';
import { validateQuery } from '../../../utils/validate-query.js';
import { replaceFuncs } from './replace-funcs.js';

/**
 * Resolve the aggregation query based on the requested aggregated fields
 */
export async function getAggregateQuery(
	rawQuery: Query,
	selections: readonly SelectionNode[],
	schema: SchemaOverview,
	accountability?: Accountability | null,
): Promise<Query> {
	const query: Query = await sanitizeQuery(rawQuery, schema, accountability);

	query.aggregate = {};

	for (let aggregationGroup of selections) {
		if ((aggregationGroup.kind === 'Field') !== true) continue;

		aggregationGroup = aggregationGroup as FieldNode;

		// filter out graphql pointers, like __typename
		if (aggregationGroup.name.value.startsWith('__')) continue;

		const aggregateProperty = aggregationGroup.name.value as keyof Aggregate;

		query.aggregate[aggregateProperty] =
			aggregationGroup.selectionSet?.selections
				// filter out graphql pointers, like __typename
				.filter((selectionNode) => !(selectionNode as FieldNode)?.name.value.startsWith('__'))
				.map((selectionNode) => {
					selectionNode = selectionNode as FieldNode;
					return selectionNode.name.value;
				}) ?? [];
	}

	if (query.filter) {
		query.filter = replaceFuncs(query.filter);
	}

	validateQuery(query);

	return query;
}
