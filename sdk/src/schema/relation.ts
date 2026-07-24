import type { CompleteSchema, MergeCoreCollection } from '../index.js';

export type DirectusRelation<Schema = any> = {
	collection: keyof CompleteSchema<Schema>;
	field: string;
	related_collection: keyof CompleteSchema<Schema> | null;
	meta: MergeCoreCollection<
		Schema,
		'directus_relations',
		{
			id?: number;
			junction_field: string | null;
			many_collection: keyof CompleteSchema<Schema>;
			many_field: string;
			one_allowed_collections: (keyof CompleteSchema<Schema>)[] | null;
			one_collection: keyof CompleteSchema<Schema> | null;
			one_collection_field: string | null;
			one_deselect_action: 'nullify' | 'delete';
			one_field: string | null;
			sort_field: string | null;
			system?: boolean;
		}
	> | null;
	schema: {
		column: string;
		constraint_name: string | null;
		foreign_key_column: string;
		foreign_key_schema?: string;
		foreign_key_table: keyof CompleteSchema<Schema>;
		on_delete: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | null;
		on_update: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | null;
		table: keyof CompleteSchema<Schema>;
	} | null;
};
