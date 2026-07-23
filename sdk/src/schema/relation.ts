import type { AllCollections, MergeCoreCollection } from '../index.js';

export type DirectusRelation<Schema = any> = {
	collection: AllCollections<Schema>;
	field: string;
	related_collection: AllCollections<Schema> | null;
	meta: MergeCoreCollection<
		Schema,
		'directus_relations',
		{
			id?: number;
			junction_field: string | null;
			many_collection: AllCollections<Schema>;
			many_field: string;
			one_allowed_collections: string | null;
			one_collection: AllCollections<Schema> | null;
			one_collection_field: string | null;
			one_deselect_action: string;
			one_field: string | null;
			sort_field: string | null;
			system: boolean | null;
		}
	> | null;
	schema: {
		column: string;
		constraint_name: string | null;
		foreign_key_column: string;
		foreign_key_schema: string;
		foreign_key_table: string;
		on_delete: string | null;
		on_update: string | null;
		table: string;
	} | null;
};
