import Keyv from 'keyv';
import { Knex } from 'knex';
import { Accountability, Helpers, Relation, RelationMeta, SchemaOverview } from '../types';
import { ItemsService, QueryOptions } from './items';
import { PermissionsService } from './permissions';
export declare interface RelationsService {
	knex: Knex;
	permissionsService: PermissionsService;
	schemaInspector: any; // should be ReturnType<typeof SchemaInspector>; with SchemaInspector from '@directus/schema';
	accountability: Accountability | null;
	schema: SchemaOverview;
	relationsItemService: ItemsService<RelationMeta>;
	systemCache: Keyv<any>;
	helpers: Helpers;
	readAll(collection?: string, opts?: QueryOptions): Promise<Relation[]>;
	readOne(collection: string, field: string): Promise<Relation>;
	/**
	 * Create a new relationship / foreign key constraint
	 */
	createOne(relation: Partial<Relation>): Promise<void>;
	/**
	 * Update an existing foreign key constraint
	 *
	 * Note: You can update anything under meta, but only the `on_delete` trigger under schema
	 */
	updateOne(collection: string, field: string, relation: Partial<Relation>): Promise<void>;
	/**
	 * Delete an existing relationship
	 */
	deleteOne(collection: string, field: string): Promise<void>;
}
