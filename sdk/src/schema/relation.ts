import type { MergeCoreCollection } from '../index.js';

export type DirectusRelation<Schema extends object> = {
	collection: string; // TODO keyof complete schema
	field: string;
	related_collection: string; // TODO keyof complete schema
	meta: MergeCoreCollection<
		Schema,
		'directus_relations',
		{
			id: number;
			junction_field: string | null;
			many_collection: string | null; // TODO keyof complete schema
			many_field: string | null;
			one_allowed_collections: string | null;
			one_collection: string | null; // TODO keyof complete schema
			one_collection_field: string | null;
			one_deselect_action: string;
			one_field: string | null;
			sort_field: string | null;
			system: boolean | null;
		}
	>;
	schema: {
		column: string;
		constraint_name: string;
		foreign_key_column: string;
		foreign_key_schema: string;
		foreign_key_table: string;
		on_delete: string;
		on_update: string;
		table: string;
	};
};
