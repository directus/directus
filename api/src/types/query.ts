import { Meta } from './meta';

export type Query = {
	fields?: string[];
	sort?: Sort[];
	filter?: Filter;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: Meta[];
	search?: string;
	export?: 'json' | 'csv' | 'xliff';
	deep?: Record<string, Query>;
	language?: string;
};

export type Sort = {
	column: string;
	order: 'asc' | 'desc';
};

export type Filter = {
	[keyOrOperator: string]: Filter | any;
};

export type FilterOperator =
	| 'eq'
	| 'neq'
	| 'contains'
	| 'ncontains'
	| 'in'
	| 'nin'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'null'
	| 'nnull'
	| 'empty'
	| 'nempty';
