import type { Knex } from 'knex';

import type { Accountability } from "./accountability.js";
import type { SchemaOverview } from "./schema.js";
import type { Item, PrimaryKey } from './items.js';
import type { Query } from './query.js';

export type AbstractServiceOptions = {
	knex?: Knex | undefined;
	accountability?: Accountability | null | undefined;
	schema: SchemaOverview;
	nested?: string[];
};

export interface AbstractService<T = Item> {
	knex: Knex;
	accountability: Accountability | null | undefined;
	nested: string[];
	/** Create a single new item. */
	createOne(data: Partial<T>): Promise<PrimaryKey>;
	/** Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction. */
	createMany(data: Partial<T>[]): Promise<PrimaryKey[]>;
	/** Get single item by primary key */
	readOne(key: PrimaryKey, query?: Query): Promise<T>;
	/** Get multiple items by primary keys */
	readMany(keys: PrimaryKey[], query?: Query): Promise<T[]>;
	/** Get items by query */
	readByQuery(query: Query): Promise<T[]>;
	/** Update a single item by primary key */
	updateOne(key: PrimaryKey, data: Partial<T>): Promise<PrimaryKey>;
	/** Update many items by primary key, setting all items to the same change */
	updateMany(keys: PrimaryKey[], data: Partial<T>): Promise<PrimaryKey[]>;
	/** Delete a single item by primary key */
	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	/** Delete multiple items by primary key */
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}
