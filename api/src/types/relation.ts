import { ForeignKey } from 'knex-schema-inspector/dist/types/foreign-key';

export type RelationRaw = {
	id: number;

	many_collection: string;
	many_field: string;

	one_collection: string | null;
	one_field: string | null;

	one_deselect_action: 'nullify' | 'delete';

	one_collection_field: string | null;
	one_allowed_collections: string | null;

	junction_field: string | null;
	sort_field: string | null;
};

export type Relation = {
	collection: string;
	field: string;
	related_collection: string;

	schema: ForeignKey;

	meta?: {
		id: number;

		many_collection: string;
		many_field: string;

		one_collection: string | null;
		one_field: string | null;
		one_collection_field: string | null;
		one_allowed_collections: string[] | null;
		one_deselect_action: 'nullify' | 'delete';

		junction_field: string | null;
		sort_field: string | null;
	};
};
