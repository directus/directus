import Keyv from 'keyv';
import { Knex } from 'knex';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { ItemsService } from '../services/items';
import { PayloadService } from '../services/payload';
import { Accountability, Helpers, Type, Field, RawField, SchemaOverview } from '../types';
export declare interface FieldsService {
	knex: Knex;
	helpers: Helpers;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: any; // should be ReturnType<typeof SchemaInspector>; with SchemaInspector from '@directus/schema';
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	systemCache: Keyv<any>;
	readAll(collection?: string): Promise<Field[]>;
	readOne(collection: string, field: string): Promise<Record<string, any>>;
	createField(
		collection: string,
		field: Partial<Field> & {
			field: string;
			type: Type | null;
		},
		table?: Knex.CreateTableBuilder
	): Promise<void>;
	updateField(collection: string, field: RawField): Promise<string>;
	deleteField(collection: string, field: string): Promise<void>;
	addColumnToTable(table: Knex.CreateTableBuilder, field: RawField | Field, alter?: Column | null): void;
}
