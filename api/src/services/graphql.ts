import Knex from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, Query, SchemaOverview } from '../types';
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
} from 'graphql';
import logger from '../logger';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';
import { cloneDeep } from 'lodash';
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

export class GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
		this.fieldsService = new FieldsService(options);
		this.collectionsService = new CollectionsService(options);
		this.relationsService = new RelationsService(options);
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

	async getSchema() {
		let collectionsInSystem: Collection[] = [];

		// Collections service will throw an error if you don't have access to any collection.
		// We still want GraphQL / GraphiQL to function though, even if you don't have access to `items`
		// (you could still have access to auth/server/etc)
		try {
			collectionsInSystem = await this.collectionsService.readByQuery();
		} catch {
			collectionsInSystem = [];
		}

		const fieldsInSystem = await this.fieldsService.readAll();
		const relationsInSystem = (await this.relationsService.readByQuery({})) as Relation[];

		const schema = this.getGraphQLSchema(collectionsInSystem, fieldsInSystem, relationsInSystem);

		return schema;
	}

	getGraphQLSchema(collections: Collection[], fields: Field[], relations: Relation[]) {
		const filterTypes = this.getFilterArgs(collections, fields, relations);
		const schema: any = { items: {} };

		for (const collection of collections) {
			const systemCollection = collection.collection.startsWith('directus_');

			const schemaSection: any = {
				type: new GraphQLObjectType({
					name: collection.collection,
					description: collection.meta?.note,
					fields: () => {
						const fieldsObject: GraphQLFieldConfigMap<any, any> = {};
						const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);

						for (const field of fieldsInCollection) {
							if (field.field.startsWith('__')) {
								logger.warn(
									`GraphQL doesn't allow fields starting with "__". Field "${field.field}" in collection "${field.collection}" is unavailable in the GraphQL endpoint.`
								);
								continue;
							}

							const relationForField = relations.find((relation) => {
								return (
									(relation.many_collection === collection.collection && relation.many_field === field.field) ||
									(relation.one_collection === collection.collection && relation.one_field === field.field)
								);
							});

							if (relationForField) {
								const relationType = getRelationType({
									relation: relationForField,
									collection: collection.collection,
									field: field.field,
								});

								if (relationType === 'm2o') {
									const relatedIsSystem = relationForField.one_collection!.startsWith('directus_');

									const relatedType = relatedIsSystem
										? schema[relationForField.one_collection!.substring(9)].type
										: schema.items[relationForField.one_collection!].type;

									fieldsObject[field.field] = {
										type: relatedType,
									};
								} else if (relationType === 'o2m') {
									const relatedIsSystem = relationForField.many_collection.startsWith('directus_');

									const relatedType = relatedIsSystem
										? schema[relationForField.many_collection.substring(9)].type
										: schema.items[relationForField.many_collection].type;

									fieldsObject[field.field] = {
										type: new GraphQLList(relatedType),
										args: {
											...this.args,
											filter: {
												type: filterTypes[relationForField.many_collection],
											},
										},
									};
								} else if (relationType === 'm2a') {
									const relatedCollections = relationForField.one_allowed_collections!;

									const types: any = [];

									for (const relatedCollection of relatedCollections) {
										const relatedType = relatedCollection.startsWith('directus_')
											? schema[relatedCollection.substring(9)].type
											: schema.items[relatedCollection].type;

										types.push(relatedType);
									}

									fieldsObject[field.field] = {
										type: new GraphQLUnionType({
											name: field.collection + '__' + field.field,
											types,
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

												const type = parent[relationForField.one_collection_field!];
												return types.find((GraphQLType: any) => GraphQLType.name === type);
											},
										}),
									};
								}
							} else {
								fieldsObject[field.field] = {
									type: field.schema?.is_primary_key ? GraphQLID : getGraphQLType(field.type),
								};
							}

							fieldsObject[field.field].description = field.meta?.note;
						}

						return fieldsObject;
					},
				}),
				resolve: async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
					const data = await this.resolve(info);
					context.data = data;
					return data;
				},
				args: {
					...this.args,
					filter: {
						name: `${collection.collection}_filter`,
						type: filterTypes[collection.collection],
					},
				},
			};

			if (systemCollection) {
				schema[collection.collection.substring(9)] = schemaSection;
			} else {
				schema.items[collection.collection] = schemaSection;
			}
		}

		const schemaWithLists = cloneDeep(schema);

		for (const collection of collections) {
			if (collection.meta?.singleton !== true) {
				const systemCollection = collection.collection.startsWith('directus_');

				if (systemCollection) {
					schemaWithLists[collection.collection.substring(9)].type = new GraphQLList(
						schemaWithLists[collection.collection.substring(9)].type
					);
				} else {
					schemaWithLists.items[collection.collection].type = new GraphQLList(
						schemaWithLists.items[collection.collection].type
					);
				}
			}
		}

		const queryBase: any = {
			name: 'Query',
			fields: {
				server: {
					type: new GraphQLObjectType({
						name: 'server',
						fields: {
							ping: {
								type: GraphQLString,
								resolve: () => 'pong',
							},
						},
					}),
					resolve: () => ({}),
				},
			},
		};

		if (Object.keys(schemaWithLists).length > 0) {
			for (const key of Object.keys(schemaWithLists)) {
				if (key !== 'items') {
					queryBase.fields[key] = schemaWithLists[key];
				}
			}
		}

		if (Object.keys(schemaWithLists.items).length > 0) {
			queryBase.fields.items = {
				type: new GraphQLObjectType({
					name: 'items',
					fields: schemaWithLists.items,
				}),
				resolve: () => ({}),
			};
		}

		return new GraphQLSchema({
			query: new GraphQLObjectType(queryBase),
		});
	}

	getFilterArgs(collections: Collection[], fields: Field[], relations: Relation[]) {
		const filterTypes: any = {};

		for (const collection of collections) {
			filterTypes[collection.collection] = new GraphQLInputObjectType({
				name: `${collection.collection}_filter`,
				fields: () => {
					const filterFields: any = {
						_and: {
							type: new GraphQLList(filterTypes[collection.collection]),
						},
						_or: {
							type: new GraphQLList(filterTypes[collection.collection]),
						},
					};

					const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);

					for (const field of fieldsInCollection) {
						if (field.field.startsWith('__')) continue;

						const relationForField = relations.find((relation) => {
							return (
								(relation.many_collection === collection.collection && relation.many_field === field.field) ||
								(relation.one_collection === collection.collection && relation.one_field === field.field)
							);
						});

						if (relationForField) {
							const relationType = getRelationType({
								relation: relationForField,
								collection: collection.collection,
								field: field.field,
							});

							if (relationType === 'm2o') {
								const relatedType = filterTypes[relationForField.one_collection!];

								filterFields[field.field] = {
									type: relatedType,
								};
							} else if (relationType === 'o2m') {
								const relatedType = filterTypes[relationForField.many_collection];

								filterFields[field.field] = {
									type: relatedType,
								};
							}
							/** @TODO M2A — Handle m2a case here */
							/** @TODO
							 * Figure out how to setup filter fields for a union type output
							 */
						} else {
							const fieldType = field.schema?.is_primary_key ? GraphQLID : getGraphQLType(field.type);

							filterFields[field.field] = {
								type: new GraphQLInputObjectType({
									name: `${collection.collection}_${field.field}_filter_operators`,
									fields: {
										/* @todo make this a little smarter by only including filters that work with current type */
										_eq: {
											type: fieldType,
										},
										_neq: {
											type: fieldType,
										},
										_contains: {
											type: fieldType,
										},
										_ncontains: {
											type: fieldType,
										},
										_in: {
											type: new GraphQLList(fieldType),
										},
										_nin: {
											type: new GraphQLList(fieldType),
										},
										_gt: {
											type: fieldType,
										},
										_gte: {
											type: fieldType,
										},
										_lt: {
											type: fieldType,
										},
										_lte: {
											type: fieldType,
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
								}),
							};
						}
					}

					return filterFields;
				},
			});
		}

		return filterTypes;
	}

	async resolve(info: GraphQLResolveInfo) {
		const systemField = info.path.prev?.key !== 'items';
		const collection = systemField ? `directus_${info.fieldName}` : info.fieldName;
		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

		return await this.getData(collection, selections, info.fieldNodes[0].arguments || [], info.variableValues);
	}

	async getData(
		collection: string,
		selections: readonly SelectionNode[],
		argsArray: readonly ArgumentNode[],
		variableValues: GraphQLResolveInfo['variableValues']
	) {
		const args: Record<string, any> = this.parseArgs(argsArray, variableValues);

		const query: Query = sanitizeQuery(args, this.accountability);

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
						query.deep[current] = sanitizeQuery(args, this.accountability);
					}
				}
			}

			return fields;
		};

		query.fields = parseFields(selections);

		let service: ItemsService;

		switch (collection) {
			case 'directus_activity':
				service = new ActivityService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			// case 'directus_collections':
			// 	service = new CollectionsService({ knex: this.knex, accountability: this.accountability });
			// case 'directus_fields':
			// 	service = new FieldsService({ knex: this.knex, accountability: this.accountability });
			case 'directus_files':
				service = new FilesService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_folders':
				service = new FoldersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_folders':
				service = new FoldersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_permissions':
				service = new PermissionsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_presets':
				service = new PresetsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_relations':
				service = new RelationsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_revisions':
				service = new RevisionsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_roles':
				service = new RolesService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_settings':
				service = new SettingsService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_users':
				service = new UsersService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			case 'directus_webhooks':
				service = new WebhooksService({
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
			default:
				service = new ItemsService(collection, {
					knex: this.knex,
					accountability: this.accountability,
					schema: this.schema,
				});
		}

		const collectionInfo =
			(await this.knex.select('singleton').from('directus_collections').where({ collection: collection }).first()) ||
			systemCollectionRows.find((collectionMeta) => collectionMeta?.collection === collection);

		const result = collectionInfo?.singleton
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
}
