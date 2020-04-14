export type Relation = {
	id: number;
	collection_many: string;
	field_many: string;
	collection_one: string;
	field_one: null | string;
	junction_field: null | string;
};
