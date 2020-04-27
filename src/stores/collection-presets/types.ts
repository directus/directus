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

export type CollectionPreset = {
	id?: number;
	title: string | null;
	user: number | null;
	role: number | null;
	collection: string;
	search_query: null;
	filters: Filter[] | null;
	view_type: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	view_query: { [view_type: string]: any } | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	view_options: { [view_type: string]: any } | null;
};
