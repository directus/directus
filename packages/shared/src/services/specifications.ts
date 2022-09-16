import { Knex } from 'knex';
import { OpenAPIObject } from 'openapi3-ts';
import { AbstractServiceOptions } from '../services';
import { Accountability, SchemaOverview } from '../types';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import { GraphQLService } from './graphql';
import { RelationsService } from './relations';
export declare interface SpecificationService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;
	oas: OASSpecsService;
	graphql: GraphQLSpecsService;
}
interface SpecificationSubService {
	generate: (_?: any) => Promise<any>;
}
declare class OASSpecsService implements SpecificationSubService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;
	constructor(
		options: AbstractServiceOptions,
		{
			fieldsService,
			collectionsService,
			relationsService,
		}: {
			fieldsService: FieldsService;
			collectionsService: CollectionsService;
			relationsService: RelationsService;
		}
	);
	generate(): Promise<OpenAPIObject>;
	private generateTags;
	private generatePaths;
	private generateComponents;
	private filterCollectionFromParams;
	private getActionForMethod;
	private generateField;
	private fieldTypes;
}
declare class GraphQLSpecsService implements SpecificationSubService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	items: GraphQLService;
	system: GraphQLService;
	constructor(options: AbstractServiceOptions);
	generate(scope: 'items' | 'system'): Promise<string | import('graphql').GraphQLSchema | null>;
}
export {};
