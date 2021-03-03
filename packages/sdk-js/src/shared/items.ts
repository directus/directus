export type Field = string;
export type ID = string | number;
export type Item = Record<string, any>;
export type Payload = Record<string, any>;

export type PartialItem<T> = {
	[P in keyof T]?: T[P];
};

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type Response<T> = {
	data: T | null;
	meta?: Record<Meta, number>;
};

export type Query<T> = {
	fields?: string | string[];
	sort?: string;
	filter?: Filter<T>;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: Meta[];
	search?: string;
	export?: 'json' | 'csv';
	deep?: Record<string, Query<T>>;
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
	readOne(id: ID): Promise<T>;
	readMany(ids: ID[]): Promise<T[]>;
	readQuery(query: Query<T>): Promise<T[]>;
	createOne(item: PartialItem<T>): Promise<T>;
	createMany(items: PartialItem<T>[]): Promise<T[]>;
	updateOne(id: ID, item: PartialItem<T>): Promise<T>;
	//updateMany(id: PrimaryKey[], item: PartialItem<T>): Promise<T>;
	deleteOne(id: ID): Promise<void>;
	deleteMany(id: ID[]): Promise<void>;
}
