export interface Schema {
	a2o: A2o[];
	deep: Deep[];
	items: Items[];
	m2m: M2m[];
	m2o: M2o[];
	o2m: O2m[];
	private: Private[];
	relational: Relational[];
	singleton: Singleton;
	relational_m2m_junction: RelationalM2mJunction[];
	relational_a2o_items: RelationalA2oItems[];
}

export interface A2o {
	id: string;
	name: string | null;
	field_a: string | null;
	field_b: string | null;
}

export interface Deep {
	id: string;
	name: string | null;
	field_a: string | null;
	field_b: string | null;
	parent_id: string | O2m | null;
}

export interface Items {
	id: string;
	title: string | null;
	content: string | null;
	notes: string | null;
}

export interface M2m {
	id: string;
	name: string | null;
	field_a: string | null;
	field_b: string | null;
	parents: number[] | RelationalM2mJunction[];
}

export interface M2o {
	id: string;
	name: string | null;
	field_a: string | null;
	field_b: string | null;
}

export interface O2m {
	id: string;
	name: string | null;
	field_a: string | null;
	field_b: string | null;
	deep_o2m_related: string[] | Deep[];
	parent_id: string | Relational | null;
}

export interface Private {
	id: string;
	secret: string | null;
}

export interface Relational {
	id: string;
	name: string | null;
	m2o_related: string | M2o | null;
	o2m_related: string[] | O2m[];
	m2m_related: number[] | RelationalM2mJunction[];
	a2o_items: number[] | RelationalA2oItems[];
}

export interface Singleton {
	id: number;
	title: string | null;
	confidential: string | null;
	is_published: boolean | null;
}

export interface RelationalM2mJunction {
	id: number;
	relational_id: string | Relational | null;
	m2m_id: string | M2m | null;
}

export interface RelationalA2oItems {
	id: number;
	relational_id: string | Relational | null;
	item: string | A2o | M2o | null;
	collection: string | null;
}
