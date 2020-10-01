import Knex from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, Collection, Field, Relation, Query } from '../types';
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLScalarType, GraphQLResolveInfo, SelectionNode, FieldNode } from 'graphql';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { getGraphQLType } from '../utils/get-graphql-type';
import { RelationsService } from './relations';
import { ItemsService } from './items';

type SchemaStructure = {
	[collection: string]: {
		name: string,
		fields: Record<string, {
			name: string,
			type: GraphQLScalarType,
		}>
		$meta?: {
			single: boolean,
			relations: {
				collection: string;
				field: string;
				m2o: boolean;
			}[]
		},
	}
}

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
		this.relationsService = new RelationsService(options);
	}

	async getSchema() {
		const collectionsInSystem = await this.collectionsService.readByQuery();
		const fieldsInSystem = await this.fieldsService.readAll();
		const relationsInSystem = await this.relationsService.readByQuery({}) as Relation[];

		const schemaStructure = this.generateSchemaStructure(collectionsInSystem, fieldsInSystem, relationsInSystem);

		const schema = this.getGraphQLSchema(schemaStructure);

		return schema;
	}

	generateSchemaStructure(collections: Collection[], fields: Field[], relations: Relation[]) {
		const schemaStructure: SchemaStructure = {};

		for (const collection of collections) {
			schemaStructure[collection.collection] = {
				name: collection.collection,
				fields: {},
				$meta: {
					single: collection.meta?.single === true,
					relations: [],
				}
			}
		}

		for (const field of fields) {
			schemaStructure[field.collection].fields[field.field] = {
				name: field.field,
				type: getGraphQLType(field.type),
			}
		}

		for (const relation of relations) {}

		return schemaStructure;
	}

	getGraphQLSchema(structure: SchemaStructure) {
		const rootFields: any = {};

		for (const [collection, value] of Object.entries(structure)) {
			const meta = value.$meta;
			delete value.$meta;

			const object = new GraphQLObjectType(value);

			if (meta?.single === true) {
				rootFields[collection] = {
					type: object,
					resolve: (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info),
				};
			} else {
				rootFields[collection] = {
					type: new GraphQLList(object),
					resolve: (source: any, args: any, context: any, info: GraphQLResolveInfo) => this.resolve(info),
				};
			}
		}

		return new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Directus',
				fields: rootFields,
			}),
		});
	}

	async resolve(info: GraphQLResolveInfo) {
		const collection = info.fieldName;
		const query: Query = {};

		const selections = info.fieldNodes[0]?.selectionSet?.selections;
		if (!selections) return null;

		query.fields = selections
			.filter((selection) => selection.kind === 'Field')
			.map((selection) => {
				return (selection as FieldNode).name.value;
			});

		const service = new ItemsService(collection, { knex: this.knex, accountability: this.accountability });
		const result = await service.readByQuery(query);
		return result;
	}
}
