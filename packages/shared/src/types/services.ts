import { Knex } from 'knex';
import { Accountability, Query, SchemaOverview, Item, MutationOptions, PrimaryKey, QueryOptions } from './index';

export type AbstractServiceOptions = {
	knex?: Knex;
	accountability?: Accountability | null;
	schema: SchemaOverview;
};

export interface AbstractService {
	knex: Knex;
	accountability: Accountability | null;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;
	updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;

	upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;

	readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>>;
	upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
}
