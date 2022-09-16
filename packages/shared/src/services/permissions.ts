import Keyv from 'keyv';
import { ItemsService, QueryOptions } from '../services/items';
import { Item, MutationOptions, PermissionsAction, PrimaryKey, Query } from '../types';
export declare interface PermissionsService extends ItemsService {
	systemCache: Keyv<any>;
	getAllowedFields(action: PermissionsAction, collection?: string): Record<string, string[]>;
	readByQuery(query: Query, opts?: QueryOptions): Promise<Partial<Item>[]>;
	readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Partial<Item>[]>;
	createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;
	deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
}
