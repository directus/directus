export type Relation = {
	id: number;
	many_collection: string;
	many_field: string;

	one_collection: string;
	one_field: null | string;

	junction_field: null | string;
	one_collection_field: null | string;
	one_allowed_collections: null | string[];
};
