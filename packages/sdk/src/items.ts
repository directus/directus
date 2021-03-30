import { ID } from './types';

export type Field = string;

export type Item = Record<string, any>;

export type PartialItem<T> = {
	[P in keyof T]?: T[P] extends {} ? PartialItem<T[P]> : T[P];
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
	deep?: Record<string, QueryMany<T>>;
	export?: 'json' | 'csv';
	filter?: Filter<T>;
};

export type QueryMany<T> = QueryOne<T> & {
	sort?: Sort<T>;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: keyof ItemMetadata | '*';
};

export type Sort<T> = (`${Extract<keyof T, string>}` | `-${Extract<keyof T, string>}`)[];

export type FilterOperators =
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

export type FilterOperator<T, K extends keyof T> = {
	[O in FilterOperators]?: Filter<T> | T[K];
};

export type Filter<T> = {
	[K in keyof T]?: FilterOperator<T, K> | string | boolean | number | string[] | object;
};

/**
 * CRUD at its finest
 */
export interface IItems<T extends Item> {
	createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>>;
	createMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>>;

	readOne(id: ID, query?: QueryOne<T>): Promise<OneItem<T>>;
	readMany(query?: QueryMany<T>): Promise<ManyItems<T>>;

	updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>>;
	updateMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>>;

	deleteOne(id: ID): Promise<void>;
	deleteMany(ids: ID[]): Promise<void>;
}
