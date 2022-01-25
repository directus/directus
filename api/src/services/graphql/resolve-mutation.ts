import { Accountability, Item, Query, SchemaOverview } from '@directus/shared/types';
import { GraphQLResolveInfo } from 'graphql';
import { Knex } from 'knex';
import { formatGQLError } from './shared/format-gql-error';
import { getQuery } from './shared/get-query';
import { getService } from './shared/get-service';
import { replaceFragmentsInSelections } from './shared/replace-fragments-in-selections';

export class ResolveMutation {
	schema: SchemaOverview;
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: { knex: Knex; accountability: Accountability | null; schema: SchemaOverview }) {
		this.knex = options.knex;
		this.accountability = options.accountability;
		this.schema = options.schema;
	}

	async resolveMutation(
		args: Record<string, any>,
		info: GraphQLResolveInfo,
		scope: string
	): Promise<Partial<Item> | boolean | undefined> {
		const action = info.fieldName.split('_')[0] as 'create' | 'update' | 'delete';
		let collection = info.fieldName.substring(action.length + 1);
		if (scope === 'system') collection = `directus_${collection}`;

		const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);
		const query = getQuery(args, selections || [], info.variableValues, this.accountability);

		const singleton =
			collection.endsWith('_items') === false &&
			collection.endsWith('_item') === false &&
			collection in this.schema.collections;

		const single = collection.endsWith('_items') === false;

		if (collection.endsWith('_items')) collection = collection.slice(0, -6);
		if (collection.endsWith('_item')) collection = collection.slice(0, -5);

		if (singleton && action === 'update') {
			return await this.upsertSingleton(collection, args.data, query);
		}

		const service = getService(
			{ knex: this.knex, accountability: this.accountability, schema: this.schema },
			collection
		);
		const hasQuery = (query.fields || []).length > 0;

		try {
			if (single) {
				if (action === 'create') {
					const key = await service.createOne(args.data);
					return hasQuery ? await service.readOne(key, query) : true;
				}

				if (action === 'update') {
					const key = await service.updateOne(args.id, args.data);
					return hasQuery ? await service.readOne(key, query) : true;
				}

				if (action === 'delete') {
					await service.deleteOne(args.id);
					return { id: args.id };
				}
			} else {
				if (action === 'create') {
					const keys = await service.createMany(args.data);
					return hasQuery ? await service.readMany(keys, query) : true;
				}

				if (action === 'update') {
					const keys = await service.updateMany(args.ids, args.data);
					return hasQuery ? await service.readMany(keys, query) : true;
				}

				if (action === 'delete') {
					const keys = await service.deleteMany(args.ids);
					return { ids: keys };
				}
			}
		} catch (err: any) {
			return formatGQLError(err);
		}
	}

	/**
	 * Upsert and read singleton item
	 */
	async upsertSingleton(
		collection: string,
		body: Record<string, any> | Record<string, any>[],
		query: Query
	): Promise<Partial<Item> | boolean> {
		const service = getService(
			{ knex: this.knex, accountability: this.accountability, schema: this.schema },
			collection
		);

		try {
			await service.upsertSingleton(body);

			if ((query.fields || []).length > 0) {
				const result = await service.readSingleton(query);
				return result;
			}

			return true;
		} catch (err: any) {
			throw formatGQLError(err);
		}
	}
}
