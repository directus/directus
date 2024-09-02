export type TestSchema = {
	collection_a: CollectionA[];
	collection_b: CollectionB[];
	collection_c: CollectionC[];
	// singleton
	collection_d: CollectionD[];
	// junction collections
	collection_a_b_m2m: CollectionAB_Many[];
	collection_a_b_m2a: CollectionAB_Any[];
	// directus_users: object; // workaround
};

// Collection A
export type CollectionA = {
	id: number;
	string_field: string;
	// relations
	m2o: number | CollectionB;
	o2m: number[] | CollectionC[] | null;
	m2m: number[] | CollectionAB_Many[] | null;
	m2a: number[] | CollectionAB_Any[] | null;
};

// Many-to-Many junction table
export type CollectionAB_Many = {
	id: number;
	collection_a_id: number | CollectionA;
	collection_b_id: number | CollectionB;
};

// Many-to-Any junction table
export type CollectionAB_Any = {
	id: number;
	collection_a_id: number | CollectionA;
	collection: 'collection_b' | 'collection_c';
	item: string | CollectionB | CollectionC;
};

// Collection B
export type CollectionB = {
	id: number;
	json_field: 'json' | null;
	csv_field: 'csv' | null;
};

// Collection C
export type CollectionC = {
	id: number;
	parent_id: number | CollectionA;
	dt_field: 'datetime' | null;
};

// Singleton collection
export type CollectionD = {
	id: number;
};
