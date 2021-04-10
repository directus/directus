import { Knex } from 'knex';
import { Accountability } from './accountability';
import { Item, PrimaryKey } from './items';
import { Query } from './query';
import { PermissionsAction } from './permissions';
import { SchemaOverview } from '../types';

export type AbstractServiceOptions = {
	knex?: Knex;
	accountability?: Accountability | null;
	schema: SchemaOverview;
};

export interface AbstractService {
	knex: Knex;
	accountability: Accountability | null;

	create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	create(data: Partial<Item>): Promise<PrimaryKey>;

	readByQuery(query: Query): Promise<null | Item | Item[]>;

	readByKey(keys: PrimaryKey[], query: Query, action: PermissionsAction): Promise<null | Item[]>;
	readByKey(key: PrimaryKey, query: Query, action: PermissionsAction): Promise<null | Item>;

	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	delete(key: PrimaryKey): Promise<PrimaryKey>;
}
