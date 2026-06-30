export type TestSchema = {
	collection_a: CollectionA[];
	collection_b: CollectionB[];
	collection_c: CollectionC[];
	// singleton
	// https://directus.com/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk#setting-up-a-schema
	user_defined_singleton: CollectionD;
	// junction collections
	collection_a_b_m2m: CollectionAB_Many[];
	collection_a_b_m2a: CollectionAB_Any[];
	// extend the provided DirectusUser type
	// https://directus.com/docs/tutorials/tips-and-tricks/advanced-types-with-the-directus-sdk#custom-fields-on-core-collections
	directus_users: CustomUser;
};

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

export type CollectionB = {
	id: number;
	json_field: 'json' | null;
	csv_field: 'csv' | null;
};

export type CollectionC = {
	id: number;
	parent_id: number | CollectionA;
	dt_field: 'datetime' | null;
	date_field: 'date' | null;
	time_field: 'time' | null;
	nullable: string | null;
	non_nullable: string;
};

// Singleton collection
export type CollectionD = {
	id: number;
};

// Used to extend directus_users collection, cannot modify core fields
export type CustomUser = {
	custom_field?: boolean;
	id: number; // core collection type is string (uuid), number will not be accepted as a valid modification
};
