import { ForbiddenError } from '@directus/errors';
import type { ItemPermissions, Permission, PermissionsAction, Query } from '@directus/types';
import type Keyv from 'keyv';
import { clearSystemCache, getCache } from '../../cache.js';
import type { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../../types/index.js';
import { AuthorizationService } from '../authorization.js';
import type { QueryOptions } from '../items.js';
import { ItemsService } from '../items.js';
import { withAppMinimalPermissions } from './lib/with-app-minimal-permissions.js';

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
		const result = (await super.readByQuery(query, opts)) as Permission[];

		return withAppMinimalPermissions(this.accountability, result, query.filter);
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

	async getItemPermissions(collection: string, primaryKey?: string): Promise<ItemPermissions> {
		if (!this.accountability?.user) throw new ForbiddenError();

		if (this.accountability?.admin) {
			return {
				update: { access: true },
				delete: { access: true },
				share: { access: true },
			};
		}

		const itemPermissions: ItemPermissions = {
			update: { access: false },
			delete: { access: false },
			share: { access: false },
		};

		let updateAction: 'update' | 'create' = 'update';

		const schema = this.schema.collections[collection];

		if (schema?.singleton) {
			const itemsService = new ItemsService(collection, {
				knex: this.knex,
				schema: this.schema,
			});

			const query: Query = {
				fields: [schema.primary],
				limit: 1,
			};

			try {
				const result = await itemsService.readByQuery(query);
				if (!result[0]) updateAction = 'create';
			} catch {
				updateAction = 'create';
			}
		}

		const authorizationService = new AuthorizationService({
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		await Promise.all(
			Object.keys(itemPermissions).map((key) => {
				const action = key as keyof ItemPermissions;
				const checkAction = action === 'update' ? updateAction : action;

				return authorizationService
					.checkAccess(checkAction, collection, primaryKey)
					.then(() => (itemPermissions[action].access = true))
					.catch(() => {});
			}),
		);

		if (schema?.singleton && itemPermissions.update.access) {
			const query: Query = {
				filter: {
					_and: [
						...(this.accountability?.role ? [{ role: { _eq: this.accountability.role } }] : []),
						{ collection: { _eq: collection } },
						{ action: { _eq: updateAction } },
					],
				},
				fields: ['presets', 'fields'],
			};

			try {
				const result = await this.readByQuery(query);
				const permission = result[0];

				if (permission) {
					itemPermissions.update.presets = permission['presets'];
					itemPermissions.update.fields = permission['fields'];
				}
			} catch {
				// No permission
			}
		}

		return itemPermissions;
	}
}
