import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { Item, PrimaryKey } from './items.js';

export type AbstractServiceOptions = {
	knex?: Knex;
	accountability?: Accountability | null | undefined;
	schema: SchemaOverview;
};

export interface AbstractService {
	knex: Knex;
	accountability: Accountability | null | undefined;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
