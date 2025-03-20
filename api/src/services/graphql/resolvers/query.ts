import type { Item, Query } from '@directus/types';
import { parseFilterFunctionPath } from '@directus/utils';
import type { GraphQLResolveInfo } from 'graphql';
import { omit } from 'lodash-es';
import { mergeVersionsRaw, mergeVersionsRecursive } from '../../../utils/merge-version-data.js';
import { VersionsService } from '../../versions.js';
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
	let versionRaw = false;

	const isAggregate = collection.endsWith('_aggregated') && collection in gql.schema.collections === false;

	if (isAggregate) {
		query = await getAggregateQuery(args, selections, gql.schema, gql.accountability);
		collection = collection.slice(0, -11);
	} else {
		query = await getQuery(args, selections, info.variableValues, gql.schema, gql.accountability);

		if (collection.endsWith('_by_id') && collection in gql.schema.collections === false) {
			collection = collection.slice(0, -6);
		}

		if (collection.endsWith('_by_version') && collection in gql.schema.collections === false) {
			collection = collection.slice(0, -11);
			versionRaw = true;
		}
	}

	if (args['id']) {
		query.filter = {
			_and: [
				query.filter || {},
				{
					[gql.schema.collections[collection]!.primary]: {
						_eq: args['id'],
					},
				},
			],
		};

		query.limit = 1;
	}

	// Transform count(a.b.c) into a.b.count(c)
	if (query.fields?.length) {
		for (let fieldIndex = 0; fieldIndex < query.fields.length; fieldIndex++) {
			query.fields[fieldIndex] = parseFilterFunctionPath(query.fields[fieldIndex]!);
		}
	}

	const result = await gql.read(collection, query);

	if (args['version']) {
		const versionsService = new VersionsService({ accountability: gql.accountability, schema: gql.schema });

		const saves = await versionsService.getVersionSaves(args['version'], collection, args['id']);

		if (saves) {
			if (gql.schema.collections[collection]!.singleton) {
				return versionRaw
					? mergeVersionsRaw(result, saves)
					: mergeVersionsRecursive(result, saves, collection, gql.schema);
			} else {
				if (result?.[0] === undefined) return null;

				return versionRaw
					? mergeVersionsRaw(result[0], saves)
					: mergeVersionsRecursive(result[0], saves, collection, gql.schema);
			}
		}
	}

	if (args['id']) {
		return result?.[0] || null;
	}

	if (query.group) {
		// for every entry in result add a group field based on query.group;
		const aggregateKeys = Object.keys(query.aggregate ?? {});

		result['map']((field: Item) => {
			field['group'] = omit(field, aggregateKeys);
		});
	}

	return result;
}
