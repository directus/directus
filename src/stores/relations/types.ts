export type Relation = {
	id: number;
	collection_many: string;
	field_many: string;
	primary_many: string;
	collection_one: string;
	field_one: null | string;
	primary_one: string;
	junction_field: null | string;
};
