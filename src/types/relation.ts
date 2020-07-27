export type Relation = {
	id: number;

	many_collection: string;
	many_field: string;
	many_primary: string;

	one_collection: string;
	one_field: string;
	one_primary: string;
};
