import { Meta } from './meta';

export type Query = {
	fields?: string[];
	sort?: Sort[];
	filter?: Filter;
	limit?: number;
	offset?: number;
	page?: number;
	meta?: Meta[];
	search?: string;
	export?: 'json' | 'csv' | 'xml';
	deep?: Record<string, Query>;
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
	| 'nempty'
	| 'intersects'
	| 'nintersects'
	| 'bbox_intersects'
	| 'bbox_nintersects';

export type ValidationOperator = 'required' | 'regex';
