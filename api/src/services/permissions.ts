import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions/index.js';
import { ItemsService, QueryOptions } from '../services/items.js';
import type { AbstractServiceOptions, Item, PrimaryKey, MutationOptions } from '../types/index.js';
import type { Query, PermissionsAction } from '@directus/shared/types';
import { filterItems } from '../utils/filter-items.js';
import { getCache } from '../cache.js';
import type { CacheService } from './cache/cache.js';
import { clearSystemCache } from '../utils/clearSystemCache.js';

export class PermissionsService extends ItemsService {
	systemCache: CacheService;

	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);

		const { systemCache } = getCache();

		this.systemCache = systemCache;
	}

	getAllowedFields(action: PermissionsAction, collection?: string): Record<string, string[]> {
		const results =
			this.accountability?.permissions?.filter((permission) => {
				let matchesCollection = true;

				if (collection) {
					matchesCollection = permission.collection === collection;
				}

				const matchesAction = permission.action === action;

				return collection ? matchesCollection && matchesAction : matchesAction;
			}) ?? [];

		const fieldsPerCollection: Record<string, string[]> = {};

		for (const result of results) {
			const { collection, fields } = result;
			if (!fieldsPerCollection[collection]) fieldsPerCollection[collection] = [];
			fieldsPerCollection[collection]!.push(...(fields ?? []));
		}

		return fieldsPerCollection;
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Partial<Item>[]> {
		const result = await super.readByQuery(query, opts);

		if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
			result.push(
				...filterItems(
					appAccessMinimalPermissions.map((permission) => ({
						...permission,
						role: this.accountability!.role,
					})),
					query.filter
				)
			);
		}

		return result;
	}

	override async readMany(keys: PrimaryKey[], query: Query = {}, opts?: QueryOptions): Promise<Partial<Item>[]> {
		const result = await super.readMany(keys, query, opts);

		if (this.accountability && this.accountability.app === true) {
			result.push(
				...filterItems(
					appAccessMinimalPermissions.map((permission) => ({
						...permission,
						role: this.accountability!.role,
					})),
					query.filter
				)
			);
		}

		return result;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.createOne(data, opts);
		await clearSystemCache();
		return res;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.createMany(data, opts);
		await clearSystemCache();
		return res;
	}

	override async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateByQuery(query, data, opts);
		await clearSystemCache();
		return res;
	}

	override async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateOne(key, data, opts);
		await clearSystemCache();
		return res;
	}

	override async updateBatch(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.updateBatch(data, opts);
		await clearSystemCache();
		return res;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateMany(keys, data, opts);
		await clearSystemCache();
		return res;
	}

	override async upsertOne(payload: Partial<Item>, opts?: MutationOptions) {
		const res = await super.upsertOne(payload, opts);
		await clearSystemCache();
		return res;
	}

	override async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.upsertMany(payloads, opts);
		await clearSystemCache();
		return res;
	}

	override async deleteByQuery(query: Query, opts?: MutationOptions) {
		const res = await super.deleteByQuery(query, opts);
		await clearSystemCache();
		return res;
	}

	override async deleteOne(key: PrimaryKey, opts?: MutationOptions) {
		const res = await super.deleteOne(key, opts);
		await clearSystemCache();
		return res;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions) {
		const res = await super.deleteMany(keys, opts);
		await clearSystemCache();
		return res;
	}
}
