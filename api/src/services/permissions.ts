import type { PermissionsAction, Query } from '@directus/types';
import type Keyv from 'keyv';
import { clearSystemCache, getCache } from '../cache.js';
import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions/index.js';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types/index.js';
import type { ItemPermissions, ItemPermissionsAccess } from '../types/permissions.js';
import { filterItems } from '../utils/filter-items.js';
import { AuthorizationService } from './authorization.js';
import type { QueryOptions } from './items.js';
import { ItemsService } from './items.js';
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
					query.filter,
				),
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
					query.filter,
				),
			);
		}

		return result;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.createOne(data, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.createMany(data, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	override async updateBatch(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.updateBatch(data, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateMany(keys, data, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	override async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.upsertMany(payloads, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions) {
		const res = await super.deleteMany(keys, opts);
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return res;
	}

	async getItemPermissions(collection: string, primaryKey: string): Promise<ItemPermissions> {
		/*
		 * TODO: Decide whether it makes sense to early return here.
		 * - Might be good in order to save resources since this endpoint is public
		 * - But need to make sure that this doesn't easily reveal info about the existence of a collection (response time)
		 */
		// if (this.accountability?.admin === true) {
		// 	return { access: { update: true, delete: true, share: true } };
		// }
		// try {
		// 	const primaryKeyField = this.schema.collections[collection]?.primary;
		// 	if (!primaryKeyField) throw new Error();
		// 	validateKeys(this.schema, collection, primaryKeyField, primaryKey);
		// } catch {
		// 	return { access };
		// }

		const access: ItemPermissionsAccess = {
			update: false,
			delete: false,
			share: false,
		};

		const authorizationService = new AuthorizationService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		await Promise.all(
			Object.keys(access).map((action) =>
				authorizationService
					.checkAccess(action as PermissionsAction, collection, primaryKey)
					.then(() => (access[action as keyof ItemPermissionsAccess] = true))
					.catch(() => {}),
			),
		);

		return { access };
	}
}
