export type FilterOperator =
	| 'eq'
	| 'neq'
	| 'lt'
	| 'lte'
	| 'gt'
	| 'gte'
	| 'in'
	| 'nin'
	| 'null'
	| 'nnull'
	| 'contains'
	| 'ncontains'
	| 'between'
	| 'nbetween'
	| 'empty'
	| 'nempty';

export type Filter = {
	key: string;
	field: string;
	operator: FilterOperator;
	value: string;
	locked?: boolean;
};

export type Preset = {
	id?: number;
	bookmark: string | null;
	user: string | null;
	role: string | null;
	collection: string;
	search: string | null;
	filters: readonly Filter[] | null;
	layout: string | null;
	layout_query: { [layout: string]: any } | null;
	layout_options: { [layout: string]: any } | null;
};
