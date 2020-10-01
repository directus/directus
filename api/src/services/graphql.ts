import Knex from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, Query } from '../types';
import { GraphQLString, GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLResolveInfo, GraphQLID, FieldNode, GraphQLFieldConfigMap, GraphQLInt, IntValueNode, StringValueNode, BooleanValueNode, } from 'graphql';
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
		const schema: any = {};

		for (const collection of collections) {
			schema[collection.collection] = {
				type: new GraphQLObjectType({
					name: collection.collection,
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
									fieldsObject[field.field] = {
										type: schema[relationForField.one_collection].type,
									}
								} else {
									fieldsObject[field.field] = {
										type: new GraphQLList(schema[relationForField.many_collection].type),
										args: this.args,
									}
								}
							} else {
								fieldsObject[field.field] = {
									type: field.schema?.is_primary_key ? GraphQLID : getGraphQLType(field.type),
								}
							}
						}

						return fieldsObject;
					},
				}),
				args: this.args,
				resolve: (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info, args)
			}
		}

		const schemaWithLists = cloneDeep(schema);

		for (const collection of collections) {
			if (collection.meta?.singleton !== true) {
				schemaWithLists[collection.collection].type = new GraphQLList(schemaWithLists[collection.collection].type);
			}
		}

		return new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Directus',
				fields: schemaWithLists,
			}),
		});
	}

	async resolve(info: GraphQLResolveInfo, args: Record<string, any>) {
		const collection = info.fieldName;
		const query: Query = sanitizeQuery(args, this.accountability);

		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

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
