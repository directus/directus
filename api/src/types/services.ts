import { Knex } from 'knex';
import { SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
import { Item, PrimaryKey } from './items';
import { Query } from '@directus/shared/types';

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

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
