import { Knex } from 'knex';
import database from '../database';
import {
	AbstractServiceOptions,
	Accountability,
	Collection,
	Field,
	Relation,
	Query,
	SchemaOverview,
	GraphQLParams,
	PrimaryKey,
	PermissionsAction,
} from '../types';
import {
	GraphQLString,
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLList,
	GraphQLResolveInfo,
	GraphQLInputObjectType,
	ObjectFieldNode,
	GraphQLID,
	FieldNode,
	InlineFragmentNode,
	SelectionNode,
	GraphQLFieldConfigMap,
	GraphQLInt,
	IntValueNode,
	StringValueNode,
	BooleanValueNode,
	ArgumentNode,
	GraphQLBoolean,
	ObjectValueNode,
	GraphQLUnionType,
	execute,
	validate,
	ExecutionResult,
	FormattedExecutionResult,
	specifiedRules,
	formatError,
	GraphQLObjectTypeConfig,
	GraphQLFloat,
	GraphQLScalarType,
	GraphQLError,
	GraphQLNonNull,
} from 'graphql';
import logger from '../logger';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';
import { cloneDeep, set, merge, get, mapKeys, filter } from 'lodash';
import { sanitizeQuery } from '../utils/sanitize-query';

import { ActivityService } from './activity';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { FilesService } from './files';
import { FoldersService } from './folders';
import { PermissionsService } from './permissions';
import { PresetsService } from './presets';
import { RevisionsService } from './revisions';
import { RolesService } from './roles';
import { SettingsService } from './settings';
import { UsersService } from './users';
import { WebhooksService } from './webhooks';

import { getRelationType } from '../utils/get-relation-type';
import { systemCollectionRows } from '../database/system-data/collections';
import { BaseException, ForbiddenException, InvalidPayloadException, GraphQLValidationException } from '../exceptions';
import { toArray } from '../utils/to-array';

import { reduceSchema } from '../utils/reduce-schema';

import {
	ObjectTypeComposer,
	ObjectTypeComposerFieldConfigMapDefinition,
	InputTypeComposerFieldConfigMapDefinition,
	SchemaComposer,
	InputTypeComposer,
	toInputObjectType,
} from 'graphql-compose';

/**
 * These should be ignored in the context of GraphQL, or are replaced by a custom resolver (for non-standard structures)
 */
const SYSTEM_DENY_LIST = [
	'directus_activity',
	'directus_collections',
	'directus_fields',
	'directus_migrations',
	'directus_sessions',
];

export class GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	scope: 'items' | 'system';

	constructor(options: AbstractServiceOptions & { scope: 'items' | 'system' }) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
		this.schema = options.schema;
		this.scope = options.scope;
	}

	args = {
		sort: {
			type: new GraphQLList(GraphQLString),
		},
		limit: {
			type: GraphQLInt,
		},
		offset: {
			type: GraphQLInt,
		},
		page: {
			type: GraphQLInt,
		},
		search: {
			type: GraphQLString,
		},
	};

	async execute({ document, query, variables, operationName }: GraphQLParams) {
		const schema = this.getSchema();

		const validationErrors = validate(schema, document, specifiedRules);

		if (validationErrors.length > 0) {
			throw new GraphQLValidationException({ graphqlErrors: validationErrors });
		}

		let result: ExecutionResult;

		try {
			result = await execute({
				schema,
				document,
				contextValue: {},
				variableValues: variables,
				operationName,
			});
		} catch (err) {
			throw new InvalidPayloadException('GraphQL execution error.', { graphqlErrors: [err] });
		}

		const formattedResult: FormattedExecutionResult = {
			...result,
			errors: result.errors?.map(formatError),
		};

		return formattedResult;
	}

	getSchema() {
		const self = this;

		const schemaComposer = new SchemaComposer();

		const schema = {
			read: this.accountability?.admin === true ? this.schema : reduceSchema(this.schema, ['read']),
			create: this.accountability?.admin === true ? this.schema : reduceSchema(this.schema, ['create']),
			update: this.accountability?.admin === true ? this.schema : reduceSchema(this.schema, ['update']),
			delete: this.accountability?.admin === true ? this.schema : reduceSchema(this.schema, ['delete']),
		};

		const { ReadCollectionTypes } = getReadableTypes();
		const { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes } = getWritableTypes();

		const scopeFilter = (collection: SchemaOverview['collections'][string]) => {
			if (this.scope === 'items' && collection.collection.startsWith('directus_') === true) return false;
			if (this.scope === 'system') {
				if (collection.collection.startsWith('directus_') === false) return false;
				if (SYSTEM_DENY_LIST.includes(collection.collection)) return false;
			}
			return true;
		};

		if (Object.keys(schema.read.collections).length > 0) {
			schemaComposer.Query.addFields(
				Object.values(schema.read.collections)
					.filter((collection) => collection.collection in ReadCollectionTypes)
					.filter(scopeFilter)
					.reduce((acc, collection) => {
						const collectionName = this.scope === 'items' ? collection.collection : collection.collection.substring(9);
						acc[collectionName] = ReadCollectionTypes[collection.collection].getResolver(collection.collection);

						if (this.schema.collections[collection.collection].singleton === false) {
							acc[`${collectionName}_by_id`] = ReadCollectionTypes[collection.collection].getResolver(
								`${collection.collection}_by_id`
							);
						}

						return acc;
					}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		if (Object.keys(schema.create.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.create.collections)
					.filter((collection) => collection.collection in CreateCollectionTypes && collection.singleton === false)
					.filter(scopeFilter)
					.reduce((acc, collection) => {
						const collectionName = this.scope === 'items' ? collection.collection : collection.collection.substring(9);
						acc[`create_${collectionName}_items`] = CreateCollectionTypes[collection.collection].getResolver(
							`create_${collection.collection}_items`
						);
						acc[`create_${collectionName}_item`] = CreateCollectionTypes[collection.collection].getResolver(
							`create_${collection.collection}_item`
						);
						return acc;
					}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		if (Object.keys(schema.update.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.update.collections)
					.filter((collection) => collection.collection in UpdateCollectionTypes)
					.filter(scopeFilter)
					.reduce((acc, collection) => {
						const collectionName = this.scope === 'items' ? collection.collection : collection.collection.substring(9);

						if (collection.singleton) {
							acc[`update_${collectionName}`] = UpdateCollectionTypes[collection.collection].getResolver(
								`update_${collection.collection}`
							);
						} else {
							acc[`update_${collectionName}_items`] = UpdateCollectionTypes[collection.collection].getResolver(
								`update_${collection.collection}_items`
							);

							acc[`update_${collectionName}_item`] = UpdateCollectionTypes[collection.collection].getResolver(
								`update_${collection.collection}_item`
							);
						}

						return acc;
					}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		if (Object.keys(schema.delete.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.delete.collections)
					.filter((collection) => collection.singleton === false)
					.filter(scopeFilter)
					.reduce((acc, collection) => {
						const collectionName = this.scope === 'items' ? collection.collection : collection.collection.substring(9);

						acc[`delete_${collectionName}_items`] = DeleteCollectionTypes.many.getResolver(
							`delete_${collection.collection}_items`
						);

						acc[`delete_${collectionName}_item`] = DeleteCollectionTypes.one.getResolver(
							`delete_${collection.collection}_item`
						);

						return acc;
					}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		return schemaComposer.buildSchema();

		function getTypes(action: 'read' | 'create' | 'update' | 'delete') {
			const CollectionTypes: Record<string, ObjectTypeComposer> = {};

			for (const collection of Object.values(schema[action].collections)) {
				if (Object.keys(collection.fields).length === 0) continue;

				CollectionTypes[collection.collection] = schemaComposer.createObjectTC({
					name: `${action}_${collection.collection}`,
					fields: Object.values(collection.fields).reduce((acc, field) => {
						acc[field.field] = {
							type: getGraphQLType(field.type),
							description: field.note,
						};

						return acc;
					}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>),
				});
			}

			for (const relation of schema[action].relations) {
				if (relation.one_collection) {
					CollectionTypes[relation.many_collection].addFields({
						[relation.many_field]: {
							type: CollectionTypes[relation.one_collection],
						},
					});

					if (relation.one_field) {
						CollectionTypes[relation.one_collection].addFields({
							[relation.one_field]: {
								type: [CollectionTypes[relation.many_collection]],
							},
						});
					}
				} else if (relation.one_allowed_collections) {
					CollectionTypes[relation.many_collection].addFields({
						[relation.many_field]: {
							type: new GraphQLUnionType({
								name: `${relation.many_collection}_${relation.many_field}_union`,
								types: relation.one_allowed_collections.map((collection) => CollectionTypes[collection].getType()),
								resolveType(value, context, info) {
									let path: (string | number)[] = [];
									let currentPath = info.path;

									while (currentPath.prev) {
										path.push(currentPath.key);
										currentPath = currentPath.prev;
									}

									path = path.reverse().slice(1, -1);

									let parent = context.data;

									for (const pathPart of path) {
										parent = parent[pathPart];
									}

									const collection = parent[relation.one_collection_field!];
									return CollectionTypes[collection].getType();
								},
							}),
						},
					});
				}
			}

			return { CollectionTypes };
		}

		function getReadableTypes() {
			const { CollectionTypes: ReadCollectionTypes } = getTypes('read');
			const ReadableCollectionFilterTypes: Record<string, InputTypeComposer> = {};

			const StringFilterOperators = schemaComposer.createInputTC({
				name: 'string_filter_operators',
				fields: {
					_eq: {
						type: GraphQLString,
					},
					_neq: {
						type: GraphQLString,
					},
					_contains: {
						type: GraphQLString,
					},
					_ncontains: {
						type: GraphQLString,
					},
					_in: {
						type: new GraphQLList(GraphQLString),
					},
					_nin: {
						type: new GraphQLList(GraphQLString),
					},
					_null: {
						type: GraphQLBoolean,
					},
					_nnull: {
						type: GraphQLBoolean,
					},
					_empty: {
						type: GraphQLBoolean,
					},
					_nempty: {
						type: GraphQLBoolean,
					},
				},
			});

			const BooleanFilterOperators = schemaComposer.createInputTC({
				name: 'boolean_filter_operators',
				fields: {
					_eq: {
						type: GraphQLBoolean,
					},
					_neq: {
						type: GraphQLBoolean,
					},
					_null: {
						type: GraphQLBoolean,
					},
					_nnull: {
						type: GraphQLBoolean,
					},
				},
			});

			const NumberFilterOperators = schemaComposer.createInputTC({
				name: 'number_filter_operators',
				fields: {
					_eq: {
						type: GraphQLFloat,
					},
					_neq: {
						type: GraphQLFloat,
					},
					_in: {
						type: new GraphQLList(GraphQLFloat),
					},
					_nin: {
						type: new GraphQLList(GraphQLFloat),
					},
					_gt: {
						type: GraphQLFloat,
					},
					_gte: {
						type: GraphQLFloat,
					},
					_lt: {
						type: GraphQLFloat,
					},
					_lte: {
						type: GraphQLFloat,
					},
					_null: {
						type: GraphQLBoolean,
					},
					_nnull: {
						type: GraphQLBoolean,
					},
				},
			});

			for (const collection of Object.values(schema.read.collections)) {
				if (Object.keys(collection.fields).length === 0) continue;

				ReadableCollectionFilterTypes[collection.collection] = schemaComposer.createInputTC({
					name: `${collection.collection}_filter`,
					fields: Object.values(collection.fields).reduce((acc, field) => {
						const graphqlType = getGraphQLType(field.type);

						let filterOperatorType: InputTypeComposer;

						switch (graphqlType) {
							case GraphQLBoolean:
								filterOperatorType = BooleanFilterOperators;
								break;
							case GraphQLInt:
							case GraphQLFloat:
								filterOperatorType = NumberFilterOperators;
							default:
								filterOperatorType = StringFilterOperators;
						}

						acc[field.field] = filterOperatorType;

						return acc;
					}, {} as InputTypeComposerFieldConfigMapDefinition),
				});

				ReadCollectionTypes[collection.collection].addResolver({
					name: collection.collection,
					args: collection.singleton
						? undefined
						: {
								filter: ReadableCollectionFilterTypes[collection.collection],
								sort: {
									type: new GraphQLList(GraphQLString),
								},
								limit: {
									type: GraphQLInt,
								},
								offset: {
									type: GraphQLInt,
								},
								page: {
									type: GraphQLInt,
								},
								search: {
									type: GraphQLString,
								},
						  },
					type: collection.singleton
						? ReadCollectionTypes[collection.collection]
						: [ReadCollectionTypes[collection.collection]],
					resolve: async ({ info }: { info: GraphQLResolveInfo }) => await self.resolveQuery(info),
				});

				if (collection.singleton === false) {
					ReadCollectionTypes[collection.collection].addResolver({
						name: `${collection.collection}_by_id`,
						type: ReadCollectionTypes[collection.collection],
						args: {
							id: GraphQLNonNull(GraphQLID),
						},
						resolve: async ({ info }: { info: GraphQLResolveInfo }) => await self.resolveQuery(info),
					});
				}
			}

			for (const relation of schema.read.relations) {
				if (relation.one_collection) {
					ReadableCollectionFilterTypes[relation.many_collection].addFields({
						[relation.many_field]: ReadableCollectionFilterTypes[relation.one_collection],
					});

					if (relation.one_field) {
						ReadableCollectionFilterTypes[relation.one_collection].addFields({
							[relation.one_field]: ReadableCollectionFilterTypes[relation.many_collection],
						});
					}
				} else if (relation.one_allowed_collections) {
					/**
					 * @TODO
					 * Looking to add nested typed filters per union type? This is where that's supposed to go.
					 */
				}
			}

			return { ReadCollectionTypes, ReadableCollectionFilterTypes };
		}

		function getWritableTypes() {
			const { CollectionTypes: CreateCollectionTypes } = getTypes('create');
			const { CollectionTypes: UpdateCollectionTypes } = getTypes('update');
			const DeleteCollectionTypes: Record<string, ObjectTypeComposer<any, any>> = {};

			for (const collection of Object.values(schema.create.collections)) {
				if (Object.keys(collection.fields).length === 0) continue;
				if (collection.collection in CreateCollectionTypes === false) continue;

				const collectionIsReadable = collection.collection in ReadCollectionTypes;

				const creatableFields = CreateCollectionTypes[collection.collection]?.getFields() || {};

				if (Object.keys(creatableFields).length > 0) {
					CreateCollectionTypes[collection.collection].addResolver({
						name: `create_${collection.collection}_items`,
						type: collectionIsReadable ? [ReadCollectionTypes[collection.collection]] : GraphQLBoolean,
						args: collectionIsReadable
							? ReadCollectionTypes[collection.collection].getResolver(collection.collection).getArgs()
							: undefined,
						resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
							await self.resolveMutation(args, info),
					});

					CreateCollectionTypes[collection.collection].addResolver({
						name: `create_${collection.collection}_item`,
						type: collectionIsReadable ? ReadCollectionTypes[collection.collection] : GraphQLBoolean,
						resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
							await self.resolveMutation(args, info),
					});

					CreateCollectionTypes[collection.collection].getResolver(`create_${collection.collection}_items`).addArgs({
						...CreateCollectionTypes[collection.collection]
							.getResolver(`create_${collection.collection}_items`)
							.getArgs(),
						data: [
							toInputObjectType(CreateCollectionTypes[collection.collection]).setTypeName(
								`create_${collection.collection}_input`
							).NonNull,
						],
					});

					CreateCollectionTypes[collection.collection].getResolver(`create_${collection.collection}_item`).addArgs({
						...CreateCollectionTypes[collection.collection]
							.getResolver(`create_${collection.collection}_item`)
							.getArgs(),
						data: toInputObjectType(CreateCollectionTypes[collection.collection]).setTypeName(
							`create_${collection.collection}_input`
						).NonNull,
					});
				}
			}

			for (const collection of Object.values(schema.update.collections)) {
				if (Object.keys(collection.fields).length === 0) continue;
				if (collection.collection in UpdateCollectionTypes === false) continue;

				const collectionIsReadable = collection.collection in ReadCollectionTypes;

				const updatableFields = UpdateCollectionTypes[collection.collection]?.getFields() || {};

				if (Object.keys(updatableFields).length > 0) {
					if (collection.singleton) {
						UpdateCollectionTypes[collection.collection].addResolver({
							name: `update_${collection.collection}`,
							type: collectionIsReadable ? ReadCollectionTypes[collection.collection] : GraphQLBoolean,
							args: {
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]).setTypeName(
									`update_${collection.collection}_input`
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});
					} else {
						UpdateCollectionTypes[collection.collection].addResolver({
							name: `update_${collection.collection}_items`,
							type: collectionIsReadable ? [ReadCollectionTypes[collection.collection]] : GraphQLBoolean,
							args: {
								...(collectionIsReadable
									? ReadCollectionTypes[collection.collection].getResolver(collection.collection).getArgs()
									: {}),
								ids: GraphQLNonNull(new GraphQLList(GraphQLID)),
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]).setTypeName(
									`update_${collection.collection}_input`
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});

						UpdateCollectionTypes[collection.collection].addResolver({
							name: `update_${collection.collection}_item`,
							type: collectionIsReadable ? ReadCollectionTypes[collection.collection] : GraphQLBoolean,
							args: {
								id: GraphQLNonNull(GraphQLID),
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]).setTypeName(
									`update_${collection.collection}_input`
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});
					}
				}
			}

			DeleteCollectionTypes.many = schemaComposer.createObjectTC({
				name: `delete_many`,
				fields: {
					ids: GraphQLNonNull(new GraphQLList(GraphQLID)),
				},
			});

			DeleteCollectionTypes.one = schemaComposer.createObjectTC({
				name: `delete_one`,
				fields: {
					id: GraphQLNonNull(GraphQLID),
				},
			});

			for (const collection of Object.values(schema.delete.collections)) {
				DeleteCollectionTypes.many.addResolver({
					name: `delete_${collection.collection}_items`,
					type: DeleteCollectionTypes.many,
					args: {
						ids: GraphQLNonNull(new GraphQLList(GraphQLID)),
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await self.resolveMutation(args, info),
				});

				DeleteCollectionTypes.one.addResolver({
					name: `delete_${collection.collection}_item`,
					type: DeleteCollectionTypes.one,
					args: {
						id: GraphQLNonNull(GraphQLID),
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await self.resolveMutation(args, info),
				});
			}

			return { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes };
		}
	}

	async resolveQuery(info: GraphQLResolveInfo) {
		let collection = info.fieldName;
		if (this.scope === 'system') collection = `directus_${collection}`;

		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

		const args: Record<string, any> = this.parseArgs(info.fieldNodes[0].arguments || [], info.variableValues);
		const query = this.getQuery(args, selections, info.variableValues);

		if (collection.endsWith('_by_id') && this.schema.collections.hasOwnProperty(collection) === false) {
			collection = collection.slice(0, -6);
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

		return result;
	}

	async resolveMutation(args: Record<string, any>, info: GraphQLResolveInfo) {
		const action = info.fieldName.split('_')[0] as 'create' | 'update' | 'delete';
		let collection = info.fieldName.substring(action.length + 1);
		if (this.scope === 'system') collection = `directus_${collection}`;

		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		const query = this.getQuery(args, selections || [], info.variableValues);

		const singleton =
			collection.endsWith('_items') === false &&
			collection.endsWith('_item') === false &&
			this.schema.collections.hasOwnProperty(collection);

		const single = collection.endsWith('_items') === false;

		if (collection.endsWith('_items')) collection = collection.slice(0, -6);
		if (collection.endsWith('_item')) collection = collection.slice(0, -5);

		switch (action) {
			case 'create':
				return await this.create(collection, args.data, query);
			case 'update':
				return singleton
					? await this.upsertSingleton(collection, args.data, query)
					: await this.update(collection, single ? args.id : args.ids, args.data, query);
			case 'delete':
				return await this.delete(collection, single ? args.id : args.ids);
		}
	}

	async read(collection: string, query: Query) {
		const service = this.getService(collection);

		const result = this.schema.collections[collection].singleton
			? await service.readSingleton(query, { stripNonRequested: false })
			: await service.readByQuery(query, { stripNonRequested: false });

		return result;
	}

	async create(collection: string, body: Record<string, any> | Record<string, any>[], query: Query) {
		const service = this.getService(collection);

		try {
			const keys = await service.create(body);

			if ((query.fields || []).length > 0) {
				const result = await service.readByKey(keys, query);
				return Array.isArray(body) ? toArray(result) : result;
			}

			return true;
		} catch (err) {
			throw this.formatError(err);
		}
	}

	async update(
		collection: string,
		keys: PrimaryKey[],
		body: Record<string, any> | Record<string, any>[],
		query: Query
	) {
		const service = this.getService(collection);

		try {
			const updatedKeys = await service.update(body, keys);

			if ((query.fields || []).length > 0) {
				const result = await service.readByKey(updatedKeys, query);
				return Array.isArray(body) ? toArray(result) : result;
			}

			return true;
		} catch (err) {
			throw this.formatError(err);
		}
	}

	async upsertSingleton(collection: string, body: Record<string, any> | Record<string, any>[], query: Query) {
		const service = this.getService(collection);

		try {
			await service.upsertSingleton(body);

			if ((query.fields || []).length > 0) {
				const result = await service.readSingleton(query);
				return result;
			}

			return true;
		} catch (err) {
			throw this.formatError(err);
		}
	}

	async delete(collection: string, keys: PrimaryKey | PrimaryKey[]) {
		const service = this.getService(collection);

		try {
			await service.delete(keys as any);
			return Array.isArray(keys) ? { ids: keys } : { id: keys };
		} catch (err) {
			throw this.formatError(err);
		}
	}

	parseArgs(
		args: readonly ArgumentNode[] | readonly ObjectFieldNode[],
		variableValues: GraphQLResolveInfo['variableValues']
	): Record<string, any> {
		if (!args || args.length === 0) return {};

		const parseObjectValue = (arg: ObjectValueNode) => {
			return this.parseArgs(arg.fields, variableValues);
		};

		const argsObject: any = {};

		for (const argument of args) {
			if (argument.value.kind === 'ObjectValue') {
				argsObject[argument.name.value] = parseObjectValue(argument.value);
			} else if (argument.value.kind === 'Variable') {
				argsObject[argument.name.value] = variableValues[argument.value.name.value];
			} else if (argument.value.kind === 'ListValue') {
				const values: any = [];

				for (const valueNode of argument.value.values) {
					if (valueNode.kind === 'ObjectValue') {
						values.push(this.parseArgs(valueNode.fields, variableValues));
					} else {
						values.push((valueNode as any).value);
					}
				}

				argsObject[argument.name.value] = values;
			} else {
				argsObject[argument.name.value] = (argument.value as IntValueNode | StringValueNode | BooleanValueNode).value;
			}
		}

		return argsObject;
	}

	getQuery(
		rawQuery: Query,
		selections: readonly SelectionNode[],
		variableValues: GraphQLResolveInfo['variableValues']
	) {
		const query: Query = sanitizeQuery(rawQuery, this.accountability);

		const parseFields = (selections: readonly SelectionNode[], parent?: string): string[] => {
			const fields: string[] = [];

			for (let selection of selections) {
				if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') !== true) continue;
				selection = selection as FieldNode | InlineFragmentNode;

				let current: string;

				if (selection.kind === 'InlineFragment') {
					// filter out graphql pointers, like __typename
					if (selection.typeCondition!.name.value.startsWith('__')) continue;

					current = `${parent}:${selection.typeCondition!.name.value}`;
				} else {
					// filter out graphql pointers, like __typename
					if (selection.name.value.startsWith('__')) continue;
					current = selection.name.value;

					if (parent) {
						current = `${parent}.${current}`;
					}
				}

				if (selection.selectionSet) {
					const children = parseFields(selection.selectionSet.selections, current);

					fields.push(...children);
				} else {
					fields.push(current);
				}

				if (selection.kind === 'Field' && selection.arguments && selection.arguments.length > 0) {
					if (selection.arguments && selection.arguments.length > 0) {
						if (!query.deep) query.deep = {};

						const args: Record<string, any> = this.parseArgs(selection.arguments, variableValues);

						set(
							query.deep,
							current,
							merge(
								get(query.deep, current),
								mapKeys(sanitizeQuery(args, this.accountability), (value, key) => `_${key}`)
							)
						);
					}
				}
			}

			return fields;
		};

		query.fields = parseFields(selections);

		return query;
	}

	formatError(error: BaseException | BaseException[]) {
		if (Array.isArray(error)) {
			return new GraphQLError(error[0].message, undefined, undefined, undefined, undefined, error[0]);
		}

		return new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
	}

	getService(collection: string) {
		switch (collection) {
			case 'directus_activity':
				return new ActivityService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_files':
				return new FilesService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_folders':
				return new FoldersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_folders':
				return new FoldersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_permissions':
				return new PermissionsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_presets':
				return new PresetsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_relations':
				return new RelationsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_revisions':
				return new RevisionsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_roles':
				return new RolesService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_settings':
				return new SettingsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_users':
				return new UsersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_webhooks':
				return new WebhooksService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			default:
				return new ItemsService(collection, {
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
		}
	}
}
