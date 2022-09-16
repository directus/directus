import { Knex } from 'knex';
import { Accountability, Item, MutationOptions, PrimaryKey, Query, SchemaOverview } from '../types';
import { ItemsService } from './items';
export declare interface UsersService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	/**
	 * Create a new user
	 */
	createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Create multiple new users
	 */
	createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Update many users by query
	 */
	updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Update a single user by primary key
	 */
	updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Update many users by primary key
	 */
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Delete a single user by primary key
	 */
	deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Delete multiple users by primary key
	 */
	deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;
	inviteUser(email: string | string[], role: string, url: string | null, subject?: string | null): Promise<void>;
	acceptInvite(token: string, password: string): Promise<void>;
	requestPasswordReset(email: string, url: string | null, subject?: string | null): Promise<void>;
	resetPassword(token: string, password: string): Promise<void>;
}
