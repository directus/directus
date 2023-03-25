import type { ForeignKey } from '@directus/schema';

export type RelationMeta = {
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

	system?: boolean;
};

export type Relation = {
	collection: string;
	field: string;
	related_collection: string | null;
	schema: ForeignKey | null;
	meta: RelationMeta | null;
};
