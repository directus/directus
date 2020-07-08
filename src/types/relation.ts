export type Relation = {
	id: number;

	collection_many: string;
	field_many: string;
	primary_many: string;

	collection_one: string;
	field_one: string;
	primary_one: string;
};
