import type { Item, PrimaryKey } from '@directus/types';
import type { GraphQLResolveInfo } from 'graphql';
import { getService } from '../../../utils/get-service.js';
import { formatError } from '../errors/format.js';
import type { GraphQLService } from '../index.js';
import { getQuery } from '../schema/parse-query.js';
import { replaceFragmentsInSelections } from '../utils/replace-fragments.js';

export async function resolveMutation(
	gql: GraphQLService,
	args: Record<string, any>,
	info: GraphQLResolveInfo,
): Promise<Partial<Item> | boolean | undefined> {
	const action = info.fieldName.split('_')[0] as 'create' | 'update' | 'delete';
	let collection = info.fieldName.substring(action.length + 1);
	if (gql.scope === 'system') collection = `directus_${collection}`;

	const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);
	const query = await getQuery(args, gql.schema, selections || [], info.variableValues, gql.accountability, collection);

	const singleton =
		collection.endsWith('_batch') === false &&
		collection.endsWith('_items') === false &&
		collection.endsWith('_item') === false &&
		collection in gql.schema.collections;

	const single = collection.endsWith('_items') === false && collection.endsWith('_batch') === false;
	const batchUpdate = action === 'update' && collection.endsWith('_batch');

	if (collection.endsWith('_batch')) collection = collection.slice(0, -6);
	if (collection.endsWith('_items')) collection = collection.slice(0, -6);
	if (collection.endsWith('_item')) collection = collection.slice(0, -5);

	if (singleton && action === 'update') {
		return await gql.upsertSingleton(collection, args['data'], query);
	}

	const service = getService(collection, {
		knex: gql.knex,
		accountability: gql.accountability,
		schema: gql.schema,
	});

	const hasQuery = (query.fields || []).length > 0;

	try {
		if (single) {
			if (action === 'create') {
				const key = await service.createOne(args['data']);
				return hasQuery ? await service.readOne(key, query) : true;
			}

			if (action === 'update') {
				const key = await service.updateOne(args['id'], args['data']);
				return hasQuery ? await service.readOne(key, query) : true;
			}

			if (action === 'delete') {
				await service.deleteOne(args['id']);
				return { id: args['id'] };
			}

			return undefined;
		} else {
			if (action === 'create') {
				const keys = await service.createMany(args['data']);
				return hasQuery ? await service.readMany(keys, query) : true;
			}

			if (action === 'update') {
				const keys: PrimaryKey[] = [];

				if (batchUpdate) {
					keys.push(...(await service.updateBatch(args['data'])));
				} else {
					keys.push(...(await service.updateMany(args['ids'], args['data'])));
				}

				return hasQuery ? await service.readMany(keys, query) : true;
			}

			if (action === 'delete') {
				const keys = await service.deleteMany(args['ids']);
				return { ids: keys };
			}

			return undefined;
		}
	} catch (err: any) {
		return formatError(err);
	}
}
