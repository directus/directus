import { ID } from './types';

export type Field = string;

export type Item = Record<string, any>;

export type PartialItem<T> = {
	[P in keyof T]?: T[P] extends Record<string, any> ? PartialItem<T[P]> : T[P];
};

export type OneItem<T extends Item> = PartialItem<T> | null | undefined;

export type ManyItems<T extends Item> = {
	data?: PartialItem<T>[] | null;
	meta?: ItemMetadata;
};

export type ItemMetadata = {
	total_count?: number;
	filter_count?: number;
};

export type Payload = Record<string, any>;

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type QueryOne<T> = {
	fields?: keyof T | (keyof T)[] | '*' | '*.*' | '*.*.*' | string | string[];
	search?: string;
	deep?: Record<string, DeepQueryMany<T>>;
	export?: 'json' | 'csv' | 'xml';
	filter?: Filter<T>;
};

export type QueryMany<T> = QueryOne<T> & {
	sort?: Sort<T>;
	limit?: number;
	offset?: number;
	page?: number;
	meta?: keyof ItemMetadata | '*';
};

export type DeepQueryMany<T> = {
	[K in keyof QueryMany<T> as `_${string & K}`]: QueryMany<T>[K];
};

export type Sort<T> = (`${Extract<keyof T, string>}` | `-${Extract<keyof T, string>}`)[];

export type FilterOperators<T> = {
	_eq?: T;
	_neq?: T;
	_gt?: T;
	_gte?: T;
	_lt?: T;
	_lte?: T;
	_in?: T[];
	_nin?: T[];
	_between?: [T, T];
	_nbetween?: [T, T];
	_contains?: T;
	_ncontains?: T;
	_empty?: boolean;
	_nempty?: boolean;
	_nnull?: boolean;
	_null?: boolean;
	_intersects?: T;
	_nintersects?: T;
	_intersects_bbox?: T;
	_nintersects_bbox?: T;
};

export type LogicalFilterAnd<T> = { _and: Filter<T>[] };
export type LogicalFilterOr<T> = { _or: Filter<T>[] };
export type LogicalFilter<T> = LogicalFilterAnd<T> | LogicalFilterOr<T>;

export type FieldFilter<T> = {
	[K in keyof T]?: FilterOperators<T[K]> | FieldFilter<T[K]>;
};

export type Filter<T> = LogicalFilter<T> | FieldFilter<T extends Array<unknown> ? T[number] : T>;

/**
 * CRUD at its finest
 */
export interface IItems<T extends Item> {
	createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>>;
	createMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>>;

	readOne(id: ID, query?: QueryOne<T>): Promise<OneItem<T>>;
	readMany(query?: QueryMany<T>): Promise<ManyItems<T>>;

	updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>>;
	updateMany(ids: ID[], item: PartialItem<T>, query?: QueryMany<T>): Promise<ManyItems<T>>;

	deleteOne(id: ID): Promise<void>;
	deleteMany(ids: ID[]): Promise<void>;
}
