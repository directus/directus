export type RelationRaw = {
	id: number;

	many_collection: string;
	many_field: string;
	many_primary: string;

	one_collection: string | null;
	one_field: string | null;
	one_primary: string | null;

	one_collection_field: string | null;
	one_allowed_collections: string | null;

	junction_field: string | null;
	sort_field: string | null;
};

export type Relation = {
	id: number;

	many_collection: string;
	many_field: string;
	many_primary: string;

	one_collection: string | null;
	one_field: string | null;
	one_primary: string | null;

	one_collection_field: string | null;
	one_allowed_collections: string[] | null;

	junction_field: string | null;
	sort_field: string | null;
};
