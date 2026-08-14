import type { CollectionName, MergeCoreCollection, StringLiteralUnion } from '../index.js';

export type DirectusRelation<Schema = any> = {
	collection: CollectionName<Schema>;
	field: string;
	related_collection: CollectionName<Schema> | null;
	meta: MergeCoreCollection<
		Schema,
		'directus_relations',
		{
			id: number;
			junction_field: string | null;
			many_collection: CollectionName<Schema>;
			many_field: string;
			one_allowed_collections: CollectionName<Schema>[] | null;
			one_collection: CollectionName<Schema> | null;
			one_collection_field: string | null;
			one_deselect_action: StringLiteralUnion<'nullify' | 'delete'>;
			one_field: string | null;
			sort_field: string | null;
			system?: boolean;
		}
	> | null;
	schema: {
		column: string;
		constraint_name: string | null;
		foreign_key_column: string;
		foreign_key_schema?: string | null;
		foreign_key_table: CollectionName<Schema>;
		on_delete: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | null;
		on_update: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | null;
		table: CollectionName<Schema>;
	} | null;
};
