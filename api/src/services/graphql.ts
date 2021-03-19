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
} from 'graphql';
import logger from '../logger';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';
import { cloneDeep, set, merge, get, mapKeys } from 'lodash';
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
import { ForbiddenException, InvalidPayloadException } from '../exceptions';

import { reduceSchema } from '../utils/reduce-schema';

import {
	ObjectTypeComposer,
	ObjectTypeComposerFieldConfigMapDefinition,
	InputTypeComposerFieldConfigMapDefinition,
	SchemaComposer,
	InputTypeComposer,
	toInputObjectType,
} from 'graphql-compose';

export class GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
		this.schema = options.schema;
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
			throw new InvalidPayloadException('GraphQL validation error.', { graphqlErrors: validationErrors });
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

		const { ReadableCollectionTypes } = getReadableTypes();
		const { CreateCollectionTypes } = getWritableTypes();

		if (Object.keys(schema.read.collections).length > 0) {
			schemaComposer.Query.addFields(
				Object.values(schema.read.collections).reduce((acc, collection) => {
					acc[collection.collection] = ReadableCollectionTypes[collection.collection].getResolver(
						collection.collection
					);
					return acc;
				}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		if (Object.keys(schema.create.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.create.collections).reduce((acc, collection) => {
					acc[`create_${collection.collection}`] = CreateCollectionTypes[collection.collection].getResolver(
						collection.collection
					);
					return acc;
				}, {} as ObjectTypeComposerFieldConfigMapDefinition<any, any>)
			);
		}

		return schemaComposer.buildSchema();

		function getTypes(action: 'read' | 'create' | 'update' | 'delete') {
			const CollectionTypes: Record<string, ObjectTypeComposer> = {};

			for (const collection of Object.values(schema[action].collections)) {
				CollectionTypes[collection.collection] = schemaComposer.createObjectTC({
					name: collection.collection,
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
			const { CollectionTypes: ReadableCollectionTypes } = getTypes('read');
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

				ReadableCollectionTypes[collection.collection].addResolver({
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
						? ReadableCollectionTypes[collection.collection]
						: [ReadableCollectionTypes[collection.collection]],
					resolve: async ({ info }: { info: GraphQLResolveInfo }) => await self.resolveQuery(info),
				});
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

			return { ReadableCollectionTypes, ReadableCollectionFilterTypes };
		}

		function getWritableTypes() {
			const { CollectionTypes: CreateCollectionTypes } = getTypes('create');

			for (const collection of Object.values(schema.read.collections)) {
				CreateCollectionTypes[collection.collection].addResolver({
					name: collection.collection,
					type: [ReadableCollectionTypes[collection.collection]],
					args: {
						data: [
							toInputObjectType(CreateCollectionTypes[collection.collection]).setTypeName(
								`create_${collection.collection}_input`
							),
						],
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await self.resolveMutation(args, info),
				});
			}

			return { CreateCollectionTypes };
		}
	}

	async resolveQuery(info: GraphQLResolveInfo) {
		const collection = info.fieldName;
		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

		const args: Record<string, any> = this.parseArgs(info.fieldNodes[0].arguments || [], info.variableValues);

		const query = this.getQuery(args, selections, info.variableValues);

		const result = await this.read(collection, query);

		return result;
	}

	async resolveMutation(args: Record<string, any>, info: GraphQLResolveInfo) {
		const action = info.fieldName.split('_')[0] as 'create' | 'update' | 'delete';
		const collection = info.fieldName.substring(action.length + 1);
		// const collection = info.fieldName;
		// const selections = info.fieldNodes[0]?.selectionSet?.selections;
		// if (!selections) return null;

		// const result = await this.getData(collection, selections, info.fieldNodes[0].arguments || [], info.variableValues);
		// return result;
		return {};
	}

	async read(collection: string, query: Query) {
		const service = new ItemsService(collection, {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const result = this.schema.collections[collection].singleton
			? await service.readSingleton(query, { stripNonRequested: false })
			: await service.readByQuery(query, { stripNonRequested: false });

		return result;
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
}
