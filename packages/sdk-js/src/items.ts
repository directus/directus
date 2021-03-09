import { ID } from './types';

export type Field = string;

export type Item = Record<string, any>;
export type Items<T extends Item> = {
	data: T[];
	metadata?: ItemMetadata;
};

export type ItemMetadata = {
	total_count?: number;
	filter_count?: number;
};

export type Payload = Record<string, any>;

export type PartialItem<T> = {
	[P in keyof T]?: T[P];
};

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type ItemResponse<T> = {
	data: T | null;
	meta?: Record<Meta, number>;
};

export type QueryOne<T> = {
	fields?: string | string[];
	search?: string;
	deep?: Record<string, QueryMany<T>>;
	export?: 'json' | 'csv';
	filter?: Filter<T>;
};

export type QueryMany<T> = QueryOne<T> & {
	sort?: string;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: keyof ItemMetadata;
};

export type Filter<T> = {
	[keyOrOperator: string]: Filter<T> | string | boolean | number | string[];
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

export interface IItems<T extends Item> {
	// TODO: add fields
	read(query: QueryMany<T>): Promise<T[]>;
	readOne(id: ID, query: QueryOne<T>): Promise<T>;
	readMany(ids: ID[], query: QueryOne<T>): Promise<T[]>;

	// TODO: add fields
	createOne(item: PartialItem<T>): Promise<T>;
	createMany(items: PartialItem<T>[]): Promise<T[]>;

	// TODO: add fields
	updateOne(id: ID, item: PartialItem<T>): Promise<T>;
	//updateMany(id: PrimaryKey[], item: PartialItem<T>): Promise<T>;

	deleteOne(id: ID): Promise<void>;
	deleteMany(id: ID[]): Promise<void>;
}
