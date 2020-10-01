import Knex from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, Query } from '../types';
import { GraphQLString, GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLResolveInfo, GraphQLID, FieldNode, GraphQLFieldConfigMap, GraphQLInt, IntValueNode, StringValueNode, BooleanValueNode, ArgumentNode } from 'graphql';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';
import { cloneDeep, flatten } from 'lodash';
import { sanitizeQuery } from '../utils/sanitize-query';

export class GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;

	constructor(options?: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
		this.fieldsService = new FieldsService(options);
		this.collectionsService = new CollectionsService(options);
		this.relationsService = new RelationsService({ knex: this.knex });
	}

	args = {
		sort: {
			type: GraphQLString
		},
		limit: {
			type: GraphQLInt,
		},
		// filter: {
		// 	type: GraphQL,
		// },
		// @TODO research "any object input" arg type
		offset: {
			type: GraphQLInt,
		},
		page: {
			type: GraphQLInt,
		},
		search: {
			type: GraphQLString,
		}
	}

	async getSchema() {
		const collectionsInSystem = await this.collectionsService.readByQuery();
		const fieldsInSystem = await this.fieldsService.readAll();
		const relationsInSystem = await this.relationsService.readByQuery({}) as Relation[];

		const schema = this.getGraphQLSchema(collectionsInSystem, fieldsInSystem, relationsInSystem);

		return schema;
	}

	getGraphQLSchema(collections: Collection[], fields: Field[], relations: Relation[]) {
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
							const relationForField = relations.find((relation) => {
								return relation.many_collection === collection.collection && relation.many_field === field.field ||
									relation.one_collection === collection.collection && relation.one_field === field.field;
							});

							if (relationForField) {
								const isM2O = relationForField.many_collection === collection.collection && relationForField.many_field === field.field;

								if (isM2O) {
									const relatedIsSystem = relationForField.one_collection.startsWith('directus_');
									const relatedType = relatedIsSystem ? schema[relationForField.one_collection.substring(9)].type : schema.items[relationForField.one_collection].type;

									fieldsObject[field.field] = {
										type: relatedType,
									}
								} else {
									const relatedIsSystem = relationForField.many_collection.startsWith('directus_');
									const relatedType = relatedIsSystem ? schema[relationForField.many_collection.substring(9)].type : schema.items[relationForField.many_collection].type;

									fieldsObject[field.field] = {
										type: new GraphQLList(relatedType),
										args: this.args,
									}
								}
							} else {
								fieldsObject[field.field] = {
									type: field.schema?.is_primary_key ? GraphQLID : getGraphQLType(field.type),
								}
							}

							fieldsObject[field.field].description = field.meta?.note;
						}

						return fieldsObject;
					},
				}),
				args: this.args,
			};

			if (systemCollection) {
				schemaSection.resolve = (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info)
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
					schemaWithLists[collection.collection.substring(9)].type = new GraphQLList(schemaWithLists[collection.collection.substring(9)].type);
				} else {
					schemaWithLists.items[collection.collection].type = new GraphQLList(schemaWithLists.items[collection.collection].type);
				}
			}
		}

		schemaWithLists.items = {
			type: new GraphQLObjectType({
				name: 'items',
				fields: schemaWithLists.items,
			}),
			resolve: (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info),
		};

		return new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Directus',
				fields: schemaWithLists,
			}),
		});
	}

	async resolve(info: GraphQLResolveInfo) {
		if (info.fieldName === 'items') {
			const data: Record<string, any> = {};

			const selections = info.fieldNodes[0]?.selectionSet?.selections?.filter((node) => node.kind === 'Field') as FieldNode[] | undefined;
			if (!selections) return null;

			for (const collectionSelection of selections) {
				const collection = collectionSelection.name.value;
				const selections = collectionSelection.selectionSet?.selections?.filter((node) => node.kind === 'Field') as FieldNode[] | undefined;
				if (!selections) continue;

				data[collection] = await this.getData(collection, selections, collectionSelection.arguments);
			}

			return data;
		} else {
			const collection = `directus_${info.fieldName}`;
			const selections = info.fieldNodes[0]?.selectionSet?.selections?.filter((node) => node.kind === 'Field') as FieldNode[] | undefined;
			if (!selections) return null;

			return await this.getData(collection, selections, info.fieldNodes[0].arguments);
		}
	}

	async getData(collection: string, selections: FieldNode[], argsArray?: readonly ArgumentNode[]) {
		const args: Record<string, any> = {};

		if (argsArray) {
			for (const argument of argsArray) {
				args[argument.name.value] = (argument.value as IntValueNode | StringValueNode | BooleanValueNode).value;
			}
		}

		const query: Query = sanitizeQuery(args, this.accountability);

		const parseFields = (selections: FieldNode[], parent?: string): string[] => {
			const fields: string[] = [];

			for (const selection of selections) {
				const current = parent ? `${parent}.${selection.name.value}` : selection.name.value;

				if (selection.selectionSet === undefined) {
					fields.push(current);
				} else {
					const children = parseFields(selection.selectionSet.selections.filter((selection) => selection.kind === 'Field') as FieldNode[], current);
					fields.push(...children);
				}

				if (selection.arguments && selection.arguments.length > 0) {
					if (!query.deep) query.deep = {};
					const args: Record<string, any> = {};

					for (const argument of selection.arguments) {
						args[argument.name.value] = (argument.value as IntValueNode | StringValueNode | BooleanValueNode).value;
					}

					query.deep[current] = sanitizeQuery(args, this.accountability);
				}
			}

			return fields;
		}

		query.fields = parseFields(selections.filter((selection) => selection.kind === 'Field') as FieldNode[]);

		const service = new ItemsService(collection, { knex: this.knex, accountability: this.accountability });
		const result = await service.readByQuery(query);

		return result;
	}
}
