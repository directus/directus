import { isSystemCollection } from '@directus/system-data';
import type {
	SchemaOverview
} from '@directus/types';
import {
	GraphQLSchema
} from 'graphql';
import type {
	ObjectTypeComposer,
	ObjectTypeComposerFieldConfigAsObjectDefinition
} from 'graphql-compose';
import { SchemaComposer } from 'graphql-compose';
import { fetchAllowedFieldMap, type FieldMap } from '../../../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import { fetchInconsistentFieldMap } from '../../../permissions/modules/fetch-inconsistent-field-map/fetch-inconsistent-field-map.js';
import type { GraphQLParams } from '../../../types/index.js';
import { reduceSchema } from '../../../utils/reduce-schema.js';
import { GraphQLService, READ_ONLY, SYSTEM_DENY_LIST } from '../index.js';
import { injectSystemResolvers } from '../resolvers/system.js';
import { cache } from '../schema-cache.js';
import { GraphQLVoid } from '../types/void.js';
import { sanitizeGraphqlSchema } from '../utils/sanitize-gql-schema.js';
import { getReadableTypes } from './read.js';
import { getWritableTypes } from './write.js';

export type Schema = { read: SchemaOverview; create: SchemaOverview; update: SchemaOverview; delete: SchemaOverview }
export type InconsistentFields = {
	read: FieldMap;
	create: FieldMap;
	update: FieldMap;
	delete: FieldMap;
}

export type CollectionTypes = {
	CreateCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
	ReadCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
	UpdateCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
	DeleteCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
}

/**
 * Generate the GraphQL schema. Pulls from the schema information generated by the get-schema util.
 */
export async function _getSchema(gql: GraphQLService, type: 'schema' | 'sdl' = 'schema'): Promise<GraphQLSchema | string> {
	const key = `${gql.scope}_${type}_${gql.accountability?.role}_${gql.accountability?.user}`;

	const cachedSchema = cache.get(key);

	if (cachedSchema) return cachedSchema;

	const schemaComposer = new SchemaComposer<GraphQLParams['contextValue']>();

	let schema: Schema;

	const sanitizedSchema = sanitizeGraphqlSchema(gql.schema);

	if (!gql.accountability || gql.accountability.admin) {
		schema = {
			read: sanitizedSchema,
			create: sanitizedSchema,
			update: sanitizedSchema,
			delete: sanitizedSchema,
		};
	} else {
		schema = {
			read: reduceSchema(
				sanitizedSchema,
				await fetchAllowedFieldMap(
					{
						accountability: gql.accountability,
						action: 'read',
					},
					{ schema: gql.schema, knex: gql.knex },
				),
			),
			create: reduceSchema(
				sanitizedSchema,
				await fetchAllowedFieldMap(
					{
						accountability: gql.accountability,
						action: 'create',
					},
					{ schema: gql.schema, knex: gql.knex },
				),
			),
			update: reduceSchema(
				sanitizedSchema,
				await fetchAllowedFieldMap(
					{
						accountability: gql.accountability,
						action: 'update',
					},
					{ schema: gql.schema, knex: gql.knex },
				),
			),
			delete: reduceSchema(
				sanitizedSchema,
				await fetchAllowedFieldMap(
					{
						accountability: gql.accountability,
						action: 'delete',
					},
					{ schema: gql.schema, knex: gql.knex },
				),
			),
		};
	}

	const inconsistentFields: InconsistentFields = {
		read: await fetchInconsistentFieldMap(
			{
				accountability: gql.accountability,
				action: 'read',
			},
			{ schema: gql.schema, knex: gql.knex },
		),
		create: await fetchInconsistentFieldMap(
			{
				accountability: gql.accountability,
				action: 'create',
			},
			{ schema: gql.schema, knex: gql.knex },
		),
		update: await fetchInconsistentFieldMap(
			{
				accountability: gql.accountability,
				action: 'update',
			},
			{ schema: gql.schema, knex: gql.knex },
		),
		delete: await fetchInconsistentFieldMap(
			{
				accountability: gql.accountability,
				action: 'delete',
			},
			{ schema: gql.schema, knex: gql.knex },
		),
	};

	const { ReadCollectionTypes, VersionCollectionTypes } = getReadableTypes(gql, schemaComposer, schema, inconsistentFields);
	const { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes } = getWritableTypes(gql, schemaComposer, schema, inconsistentFields, ReadCollectionTypes);
	const CollectionTypes: CollectionTypes = { CreateCollectionTypes, ReadCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes };

	const scopeFilter = (collection: SchemaOverview['collections'][string]) => {
		if (gql.scope === 'items' && isSystemCollection(collection.collection)) return false;

		if (gql.scope === 'system') {
			if (isSystemCollection(collection.collection) === false) return false;
			if (SYSTEM_DENY_LIST.includes(collection.collection)) return false;
		}

		return true;
	};

	if (gql.scope === 'system') {
		injectSystemResolvers(
			gql,
			schemaComposer,
			CollectionTypes,
			schema,
		);
	}

	const readableCollections = Object.values(schema.read.collections)
		.filter((collection) => collection.collection in ReadCollectionTypes)
		.filter(scopeFilter);

	if (readableCollections.length > 0) {
		schemaComposer.Query.addFields(
			readableCollections.reduce(
				(acc, collection) => {
					const collectionName = gql.scope === 'items' ? collection.collection : collection.collection.substring(9);
					acc[collectionName] = ReadCollectionTypes[collection.collection]!.getResolver(collection.collection);

					if (gql.schema.collections[collection.collection]!.singleton === false) {
						acc[`${collectionName}_by_id`] = ReadCollectionTypes[collection.collection]!.getResolver(
							`${collection.collection}_by_id`,
						);

						acc[`${collectionName}_aggregated`] = ReadCollectionTypes[collection.collection]!.getResolver(
							`${collection.collection}_aggregated`,
						);
					}

					if (gql.scope === 'items') {
						acc[`${collectionName}_by_version`] = VersionCollectionTypes[collection.collection]!.getResolver(
							`${collection.collection}_by_version`,
						);
					}

					return acc;
				},
				{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
			),
		);
	} else {
		schemaComposer.Query.addFields({
			_empty: {
				type: GraphQLVoid,
				description: "There's no data to query.",
			},
		});
	}

	if (Object.keys(schema.create.collections).length > 0) {
		schemaComposer.Mutation.addFields(
			Object.values(schema.create.collections)
				.filter((collection) => collection.collection in CreateCollectionTypes && collection.singleton === false)
				.filter(scopeFilter)
				.filter((collection) => READ_ONLY.includes(collection.collection) === false)
				.reduce(
					(acc, collection) => {
						const collectionName =
							gql.scope === 'items' ? collection.collection : collection.collection.substring(9);

						acc[`create_${collectionName}_items`] = CreateCollectionTypes[collection.collection]!.getResolver(
							`create_${collection.collection}_items`,
						);

						acc[`create_${collectionName}_item`] = CreateCollectionTypes[collection.collection]!.getResolver(
							`create_${collection.collection}_item`,
						);

						return acc;
					},
					{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
				),
		);
	}

	if (Object.keys(schema.update.collections).length > 0) {
		schemaComposer.Mutation.addFields(
			Object.values(schema.update.collections)
				.filter((collection) => collection.collection in UpdateCollectionTypes)
				.filter(scopeFilter)
				.filter((collection) => READ_ONLY.includes(collection.collection) === false)
				.reduce(
					(acc, collection) => {
						const collectionName =
							gql.scope === 'items' ? collection.collection : collection.collection.substring(9);

						if (collection.singleton) {
							acc[`update_${collectionName}`] = UpdateCollectionTypes[collection.collection]!.getResolver(
								`update_${collection.collection}`,
							);
						} else {
							acc[`update_${collectionName}_items`] = UpdateCollectionTypes[collection.collection]!.getResolver(
								`update_${collection.collection}_items`,
							);

							acc[`update_${collectionName}_batch`] = UpdateCollectionTypes[collection.collection]!.getResolver(
								`update_${collection.collection}_batch`,
							);

							acc[`update_${collectionName}_item`] = UpdateCollectionTypes[collection.collection]!.getResolver(
								`update_${collection.collection}_item`,
							);
						}

						return acc;
					},
					{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
				),
		);
	}

	if (Object.keys(schema.delete.collections).length > 0) {
		schemaComposer.Mutation.addFields(
			Object.values(schema.delete.collections)
				.filter((collection) => collection.singleton === false)
				.filter(scopeFilter)
				.filter((collection) => READ_ONLY.includes(collection.collection) === false)
				.reduce(
					(acc, collection) => {
						const collectionName =
							gql.scope === 'items' ? collection.collection : collection.collection.substring(9);

						acc[`delete_${collectionName}_items`] = DeleteCollectionTypes['many']!.getResolver(
							`delete_${collection.collection}_items`,
						);

						acc[`delete_${collectionName}_item`] = DeleteCollectionTypes['one']!.getResolver(
							`delete_${collection.collection}_item`,
						);

						return acc;
					},
					{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
				),
		);
	}

	if (type === 'sdl') {
		const sdl = schemaComposer.toSDL();
		cache.set(key, sdl);
		return sdl;
	}

	const gqlSchema = schemaComposer.buildSchema();
	cache.set(key, gqlSchema);
	return gqlSchema;
}
