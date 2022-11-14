import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { ItemsService, QueryOptions } from '../services/items';
import { AbstractServiceOptions, Item, PrimaryKey, MutationOptions } from '../types';
import { Query, PermissionsAction } from '@directus/shared/types';
import { filterItems } from '../utils/filter-items';
import Keyv from 'keyv';
import { getCache, clearSystemCache } from '../cache';

export class PermissionsService extends ItemsService {
	systemCache: Keyv<any>;

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
			fieldsPerCollection[collection].push(...(fields ?? []));
		}

		return fieldsPerCollection;
	}

	async readByQuery(query: Query, opts?: QueryOptions): Promise<Partial<Item>[]> {
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

	async readMany(keys: PrimaryKey[], query: Query = {}, opts?: QueryOptions): Promise<Partial<Item>[]> {
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

	async createOne(data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.createOne(data, opts);
		await clearSystemCache();
		return res;
	}

	async createMany(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.createMany(data, opts);
		await clearSystemCache();
		return res;
	}

	async updateBatch(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.updateBatch(data, opts);
		await clearSystemCache();
		return res;
	}

	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateMany(keys, data, opts);
		await clearSystemCache();
		return res;
	}

	async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.upsertMany(payloads, opts);
		await clearSystemCache();
		return res;
	}

	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions) {
		const res = await super.deleteMany(keys, opts);
		await clearSystemCache();
		return res;
	}
}
