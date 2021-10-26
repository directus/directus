export type Relation = {
	collection: string;
	field: string;
	related_collection: string | null;
	meta?: {
		id: number;
		many_collection: string;
		many_field: string;
		one_collection: string;
		one_field: null | string;
		junction_field: null | string;
		sort_field: null | string;
		one_deselect_action: 'nullify' | 'delete';
		one_collection_field: null | string;
		one_allowed_collections: null | string[];
	} | null;
	schema?: Record<string, unknown> | null;
};
