import type { Item, Query } from '@directus/types';
import { parseFilterFunctionPath } from '@directus/utils';
import type { GraphQLResolveInfo } from 'graphql';
import { omit } from 'lodash-es';
import type { GraphQLService } from '../index.js';
import { parseArgs } from '../schema/parse-args.js';
import { getQuery } from '../schema/parse-query.js';
import { getAggregateQuery } from '../utils/aggregate-query.js';
import { replaceFragmentsInSelections } from '../utils/replace-fragments.js';

/**
 * Generic resolver that's used for every "regular" items/system query. Converts the incoming GraphQL AST / fragments into
 * Directus' query structure which is then executed by the services.
 */
export async function resolveQuery(gql: GraphQLService, info: GraphQLResolveInfo): Promise<Partial<Item> | null> {
	let collection = info.fieldName;
	if (gql.scope === 'system') collection = `directus_${collection}`;
	const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);

	if (!selections) return null;
	const args: Record<string, any> = parseArgs(info.fieldNodes[0]!.arguments || [], info.variableValues);

	let query: Query;

	const isAggregate = collection.endsWith('_aggregated') && collection in gql.schema.collections === false;

	if (isAggregate) {
		collection = collection.slice(0, -11);
		query = await getAggregateQuery(args, selections, gql.schema, gql.accountability, collection);
	} else {
		if (collection.endsWith('_by_id') && collection in gql.schema.collections === false) {
			collection = collection.slice(0, -6);
		}

		query = await getQuery(args, gql.schema, selections, info.variableValues, gql.accountability, collection);

		if (collection.endsWith('_by_version') && collection in gql.schema.collections === false) {
			collection = collection.slice(0, -11);
			query.versionRaw = true;
		}
	}

	// Transform count(a.b.c) into a.b.count(c)
	if (query.fields?.length) {
		for (let fieldIndex = 0; fieldIndex < query.fields.length; fieldIndex++) {
			query.fields[fieldIndex] = parseFilterFunctionPath(query.fields[fieldIndex]!);
		}
	}

	const result = await gql.read(collection, query, args['id']);

	if (args['id']) return result;

	/**
	 * Since grouped fields are returned at the top level, we duplicate those fields
	 * into the expected `group` property on the payload, excluding any non-group
	 * fields (i.e. aggregate keys).
	 *
	 * The payload can only contain grouped fields and aggregate keys, as the
	 * aggregate selection is restricted to those fields. Therefore, the original
	 * grouped fields can safely remain at the top level.
	 *
	 * We cannot iterate over `query.group`, because grouped fields that use
	 * functions are normalized (e.g. function(field) → function_field), which would
	 * result in them being skipped.
	 *
	 * Before:
	 * { year_date: 2023, count: { id: 42 } }
	 *
	 * After:
	 * { year_date: 2023, count: { id: 42 }, group: { year_date: 2023 } }
	 */
	if (query.group) {
		const aggregateKeys = Object.keys(query.aggregate ?? {});

		result['map']((payload: Item) => {
			payload['group'] = omit(payload, aggregateKeys);
		});
	}

	return result;
}
