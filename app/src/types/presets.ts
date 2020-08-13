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
	| 'rlike'
	| 'nrlike'
	| 'between'
	| 'nbetween'
	| 'empty'
	| 'nempty'
	| 'all'
	| 'has';

export type Filter = {
	key: string;
	field: string;
	operator: FilterOperator;
	value: string;
	locked?: boolean;
};

export type Preset = {
	id?: number;
	title: string | null;
	user: string | null;
	role: string | null;
	collection: string;
	search_query: string | null;
	filters: readonly Filter[] | null;
	view_type: string | null;

	view_query: { [view_type: string]: any } | null;

	view_options: { [view_type: string]: any } | null;
};
