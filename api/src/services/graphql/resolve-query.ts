import { Accountability, Aggregate, Item, Query, SchemaOverview } from '@directus/shared/types';
import { FieldNode, GraphQLResolveInfo, SelectionNode } from 'graphql';
import { Knex } from 'knex';
import { omit } from 'lodash';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { validateQuery } from '../../utils/validate-query';
import { getQuery } from './shared/get-query';
import { getService } from './shared/get-service';
import { parseArgs } from './shared/parse-args';
import { replaceFragmentsInSelections } from './shared/replace-fragments-in-selections';

export class ResolveQuery {
	schema: SchemaOverview;
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: { knex: Knex; accountability: Accountability | null; schema: SchemaOverview }) {
		this.knex = options.knex;
		this.accountability = options.accountability;
		this.schema = options.schema;
	}

	/**
	 * Generic resolver that's used for every "regular" items/system query. Converts the incoming GraphQL AST / fragments into
	 * Directus' query structure which is then executed by the services.
	 */
	async resolveQuery(info: GraphQLResolveInfo, scope: string): Promise<Partial<Item> | null> {
		let collection = info.fieldName;
		if (scope === 'system') collection = `directus_${collection}`;
		const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);
		if (!selections) return null;
		const args: Record<string, any> = parseArgs(info.fieldNodes[0].arguments || [], info.variableValues);

		let query: Record<string, any>;

		const isAggregate = collection.endsWith('_aggregated') && collection in this.schema.collections === false;

		if (isAggregate) {
			query = this.getAggregateQuery(args, selections);
			collection = collection.slice(0, -11);
		} else {
			query = getQuery(args, selections, info.variableValues, this.accountability);

			if (collection.endsWith('_by_id') && collection in this.schema.collections === false) {
				collection = collection.slice(0, -6);
			}
		}

		if (args.id) {
			query.filter = {
				_and: [
					query.filter || {},
					{
						[this.schema.collections[collection].primary]: {
							_eq: args.id,
						},
					},
				],
			};

			query.limit = 1;
		}

		const result = await this.read(collection, query);

		if (args.id) {
			return result?.[0] || null;
		}

		if (query.group) {
			// for every entry in result add a group field based on query.group;
			const aggregateKeys = Object.keys(query.aggregate ?? {});

			result.map((field: Item) => {
				field.group = omit(field, aggregateKeys);
			});
		}

		return result;
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
