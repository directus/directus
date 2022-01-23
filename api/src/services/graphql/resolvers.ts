import { Accountability, Aggregate, Item, Query, SchemaOverview } from '@directus/shared/types';
import { FieldNode, SelectionNode } from 'graphql';
import { Knex } from 'knex';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { validateQuery } from '../../utils/validate-query';
import { getService } from './shared/get-service';

export class Resolvers {
	schema: SchemaOverview;
	knex: Knex<any, unknown[]> | undefined;
	accountability: Accountability | null;

	constructor(options: { knex: Knex; accountabilty: Accountability | null; schema: SchemaOverview }) {
		(this.knex = options.knex), (this.accountability = options.accountabilty);
		this.schema = options.schema;
	}

	/**
	 * Execute the read action on the correct service. Checks for singleton as well.
	 */
	async read(collection: string, query: Query): Promise<Partial<Item>> {
		const service = getService(
			{ knex: this.knex, accountability: this.accountability, schema: this.schema },
			collection
		);

		const result = this.schema.collections[collection].singleton
			? await service.readSingleton(query, { stripNonRequested: false })
			: await service.readByQuery(query, { stripNonRequested: false });

		return result;
	}

	/**
	 * Resolve the aggregation query based on the requested aggregated fields
	 */
	async getAggregateQuery(rawQuery: Query, selections: readonly SelectionNode[]): Promise<Query> {
		const query: Query = sanitizeQuery(rawQuery, this.accountability);

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

		validateQuery(query);

		return query;
	}
}
