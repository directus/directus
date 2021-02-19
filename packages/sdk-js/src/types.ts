export type Item = Record<string, any>;
export type Payload = Record<string, any>;
export type PrimaryKey = string | number;

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type Response<T> = {
	data: T | null;
	meta?: Record<Meta, number>;
};

export type Query = {
	fields?: string | string[];
	sort?: string;
	filter?: Filter;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: Meta[];
	search?: string;
	export?: 'json' | 'csv';
	deep?: Record<string, Query>;
};

export type Filter = {
	[keyOrOperator: string]: Filter | string | boolean | number | string[];
};

export type FilterOperator =
	| '_eq'
	| '_neq'
	| '_contains'
	| '_ncontains'
	| '_in'
	| '_nin'
	| '_gt'
	| '_gte'
	| '_lt'
	| '_lte'
	| '_null'
	| '_nnull'
	| '_empty'
	| '_nempty';

export type AuthStorage = {
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<any>;
	removeItem: (key: string) => Promise<any>;
};
