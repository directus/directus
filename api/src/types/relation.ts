export type Relation = {
	id: number;

	many_collection: string;
	many_field: string;

	one_collection: string | null;
	one_field: string | null;

	one_collection_field: string | null;
	one_allowed_collections: string | null;
};
