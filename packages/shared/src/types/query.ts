import { Filter } from './filter';

export type Query = {
	fields?: string[];
	sort?: Sort[];
	filter?: Filter;
	limit?: number;
	offset?: number;
	page?: number;
	search?: string;
	export?: 'json' | 'csv' | 'xml';
	group?: string[];
	aggregate?: Aggregate;
	deep?: Record<string, Query>;
	alias?: Record<string, string>;
};

export type Sort = {
	column: string;
	order: 'asc' | 'desc';
};

/**
 * Aggregate operation. Contains column name, and the field alias it should be returned as
 */
export type Aggregate = {
	avg?: string[];
	avgDistinct?: string[];
	count?: string[];
	countDistinct?: string[];
	sum?: string[];
	sumDistinct?: string[];
	min?: string[];
	max?: string[];
};
