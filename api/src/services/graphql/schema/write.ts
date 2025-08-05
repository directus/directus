import type { GraphQLResolveInfo } from 'graphql';
import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import type { ResolverDefinition, SchemaComposer } from 'graphql-compose';
import { ObjectTypeComposer, toInputObjectType } from 'graphql-compose';
import { GraphQLService } from '../index.js';
import { resolveMutation } from '../resolvers/mutation.js';
import { getTypes } from './get-types.js';
import { SYSTEM_DENY_LIST, type InconsistentFields, type Schema } from './index.js';

export function getWritableTypes(
	gql: GraphQLService,
	schemaComposer: SchemaComposer,
	schema: Schema,
	inconsistentFields: InconsistentFields,
	ReadCollectionTypes: Record<string, ObjectTypeComposer<any, any>>,
) {
	const { CollectionTypes: CreateCollectionTypes } = getTypes(
		schemaComposer,
		gql.scope,
		schema,
		inconsistentFields,
		'create',
	);

	const { CollectionTypes: UpdateCollectionTypes } = getTypes(
		schemaComposer,
		gql.scope,
		schema,
		inconsistentFields,
		'update',
	);

	const DeleteCollectionTypes: Record<string, ObjectTypeComposer<any, any>> = {};

	for (const collection of Object.values(schema.create.collections)) {
		if (Object.keys(collection.fields).length === 0) continue;
		if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;
		if (collection.collection in CreateCollectionTypes === false) continue;

		const collectionIsReadable = collection.collection in ReadCollectionTypes;

		const creatableFields = CreateCollectionTypes[collection.collection]?.getFields() || {};

		if (Object.keys(creatableFields).length > 0) {
			const resolverDefinition: ResolverDefinition<any, any> = {
				name: `create_${collection.collection}_items`,
				type: collectionIsReadable
					? new GraphQLNonNull(
							new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
						)
					: GraphQLBoolean,
				resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
					await resolveMutation(gql, args, info),
			};

			if (collectionIsReadable) {
				resolverDefinition.args = ReadCollectionTypes[collection.collection]!.getResolver(
					collection.collection,
				).getArgs();
			}

			CreateCollectionTypes[collection.collection]!.addResolver(resolverDefinition);

			CreateCollectionTypes[collection.collection]!.addResolver({
				name: `create_${collection.collection}_item`,
				type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
				resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
					await resolveMutation(gql, args, info),
			});

			CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_items`).addArgs({
				...CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_items`).getArgs(),
				data: [
					toInputObjectType(CreateCollectionTypes[collection.collection]!).setTypeName(
						`create_${collection.collection}_input`,
					).NonNull,
				],
			});

			CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_item`).addArgs({
				...CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_item`).getArgs(),
				data: toInputObjectType(CreateCollectionTypes[collection.collection]!).setTypeName(
					`create_${collection.collection}_input`,
				).NonNull,
			});
		}
	}

	for (const collection of Object.values(schema.update.collections)) {
		if (Object.keys(collection.fields).length === 0) continue;
		if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;
		if (collection.collection in UpdateCollectionTypes === false) continue;

		const collectionIsReadable = collection.collection in ReadCollectionTypes;

		const updatableFields = UpdateCollectionTypes[collection.collection]?.getFields() || {};

		if (Object.keys(updatableFields).length > 0) {
			if (collection.singleton) {
				UpdateCollectionTypes[collection.collection]!.addResolver({
					name: `update_${collection.collection}`,
					type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
					args: {
						data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
							`update_${collection.collection}_input`,
						).NonNull,
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await resolveMutation(gql, args, info),
				});
			} else {
				UpdateCollectionTypes[collection.collection]!.addResolver({
					name: `update_${collection.collection}_batch`,
					type: collectionIsReadable
						? new GraphQLNonNull(
								new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
							)
						: GraphQLBoolean,
					args: {
						...(collectionIsReadable
							? ReadCollectionTypes[collection.collection]!.getResolver(collection.collection).getArgs()
							: {}),
						data: [
							toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
								`update_${collection.collection}_input`,
							).NonNull,
						],
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await resolveMutation(gql, args, info),
				});

				UpdateCollectionTypes[collection.collection]!.addResolver({
					name: `update_${collection.collection}_items`,
					type: collectionIsReadable
						? new GraphQLNonNull(
								new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
							)
						: GraphQLBoolean,
					args: {
						...(collectionIsReadable
							? ReadCollectionTypes[collection.collection]!.getResolver(collection.collection).getArgs()
							: {}),
						ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
						data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
							`update_${collection.collection}_input`,
						).NonNull,
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await resolveMutation(gql, args, info),
				});

				UpdateCollectionTypes[collection.collection]!.addResolver({
					name: `update_${collection.collection}_item`,
					type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
					args: {
						id: new GraphQLNonNull(GraphQLID),
						data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
							`update_${collection.collection}_input`,
						).NonNull,
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await resolveMutation(gql, args, info),
				});
			}
		}
	}

	DeleteCollectionTypes['many'] = schemaComposer.createObjectTC({
		name: `delete_many`,
		fields: {
			ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
		},
	});

	DeleteCollectionTypes['one'] = schemaComposer.createObjectTC({
		name: `delete_one`,
		fields: {
			id: new GraphQLNonNull(GraphQLID),
		},
	});

	for (const collection of Object.values(schema.delete.collections)) {
		DeleteCollectionTypes['many']!.addResolver({
			name: `delete_${collection.collection}_items`,
			type: DeleteCollectionTypes['many'],
			args: {
				ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
			},
			resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
				await resolveMutation(gql, args, info),
		});

		DeleteCollectionTypes['one'].addResolver({
			name: `delete_${collection.collection}_item`,
			type: DeleteCollectionTypes['one'],
			args: {
				id: new GraphQLNonNull(GraphQLID),
			},
			resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
				await resolveMutation(gql, args, info),
		});
	}

	return { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes };
}
