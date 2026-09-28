export type Schema = {
	a2o: A2O[];
	deep: Deep[];
	items: Items[];
	m2m: M2M[];
	m2o: M2O[];
	o2m: O2M[];
	private: Private[];
	relational: Relational[];
	relational_a2o: RelationalA2O[];
	relational_m2m: RelationalM2M[];
	singleton: Singleton;
};
export type A2O = {
	id?: string | number;
	name?: string | number;
	field_a?: string | number;
	field_b?: string | number;
};
export type Deep = {
	id?: string | number;
	name?: string | number;
	field_a?: string | number;
	field_b?: string | number;
	parent_id?: string | number | O2M;
};
export type Items = {
	id?: string | number;
	title?: string | number;
	content?: string | number;
	notes?: string | number;
};
export type M2M = {
	id?: string | number;
	name?: string | number;
	field_a?: string | number;
	field_b?: string | number;
	parents: (string | number | RelationalM2M)[];
};
export type M2O = {
	id?: string | number;
	name?: string | number;
	field_a?: string | number;
	field_b?: string | number;
};
export type O2M = {
	id?: string | number;
	name?: string | number;
	field_a?: string | number;
	field_b?: string | number;
	parent_id?: string | number | Relational;
	deep_o2m_related: (string | number | Deep)[];
};
export type Private = {
	id?: string | number;
	secret?: string | number;
};
export type Relational = {
	id?: string | number;
	name?: string | number;
	m2o_related?: string | number | M2O;
	o2m_related: (string | number | O2M)[];
	m2m_related: (string | number | RelationalM2M)[];
	a2o_items: (string | number | RelationalA2O)[];
};
export type RelationalA2O = {
	id?: string | number;
	relational_id?: string | number | Relational;
	item?: string | number | A2O | M2O;
	collection?: string | number;
};
export type RelationalM2M = {
	id?: string | number;
	relational_id?: string | number | Relational;
	m2m_id?: string | number | M2M;
};
export type Singleton = {
	id?: string | number;
	title?: string | number;
	confidential?: string | number;
	is_published?: string | number;
};
