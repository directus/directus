import Knex from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, Query } from '../types';
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLScalarType, GraphQLResolveInfo, GraphQLID, FieldNode, GraphQLFieldConfigMap, GraphQLObjectTypeConfig } from 'graphql';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';
import { clone, cloneDeep, flatten } from 'lodash';

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
				resolve: (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info)
			}
		}

		const schemaWithLists = cloneDeep(schema);

		for (const collection of collections) {
			if (collection.meta?.single !== true) {
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

	async resolve(info: GraphQLResolveInfo) {
		const collection = info.fieldName;
		const query: Query = {};

		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

		query.fields = getFields(selections.filter((selection) => selection.kind === 'Field') as FieldNode[]);

		const service = new ItemsService(collection, { knex: this.knex, accountability: this.accountability });
		const result = await service.readByQuery(query);

		return result;

		function getFields(selections: FieldNode[], parent?: string): string[] {
			return flatten(selections!
				.map((selection) => {
					const current = parent ? `${parent}.${selection.name.value}` : selection.name.value;

					if (selection.selectionSet === undefined) {
						return current;
					} else {
						const children = getFields(selection.selectionSet.selections.filter((selection) => selection.kind === 'Field') as FieldNode[], current);
						return children;
					}
				}));
		}
	}
}
