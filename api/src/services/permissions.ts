import { ForbiddenError } from '@directus/errors';
import type { Item, ItemPermissions, Permission, PrimaryKey, Query } from '@directus/types';
import type Keyv from 'keyv';
import { mapValues, uniq } from 'lodash-es';
import { clearSystemCache, getCache } from '../cache.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import type { ValidateAccessOptions } from '../permissions/modules/validate-access/validate-access.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import type { QueryOptions } from './items.js';
import { ItemsService } from './items.js';
import { withAppMinimalPermissions } from './permissions/lib/with-app-minimal-permissions.js';

export class PermissionsService extends ItemsService {
	systemCache: Keyv<any>;

	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);

		const { systemCache } = getCache();

		this.systemCache = systemCache;
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

	/**
	 * Get all permissions + minimal app permissions (if applicable) for the user + role in the current accountability.
	 * The permissions will be filtered by IP access.
	 */
	async fetchCollectionAccessForAccountability() {
		if (!this.accountability?.user || !this.accountability?.role) throw new ForbiddenError();

		if (this.accountability?.admin) {
			return mapValues(this.schema.collections, () =>
				Object.fromEntries(
					['create', 'read', 'update', 'delete', 'share'].map((action) => [
						action,
						{
							access: true,
							full_access: true,
							fields: ['*'],
						},
					]),
				),
			);
		}

		const policies = await fetchPolicies(this.accountability, { schema: this.schema, knex: this.knex });

		const permissions = withAppMinimalPermissions(
			this.accountability,
			await fetchPermissions(
				{ policies, accountability: this.accountability },
				{ schema: this.schema, knex: this.knex },
			),
			{},
		);

		const infos: Record<string, any> = {};

		for (const perm of permissions) {
			if (!infos[perm.collection]) {
				infos[perm.collection] = {};
			}

			if (!infos[perm.collection][perm.action]) {
				infos[perm.collection][perm.action] = {
					access: true,
					full_access: false,
				};
			}

			const info = infos[perm.collection][perm.action];

			if (info.full_access === false && (perm.permissions === null || Object.keys(perm.permissions).length > 0)) {
				info.full_access = false;
			}

			if (perm.fields && info.fields?.[0] !== '*') {
				info.fields = uniq([...(info.fields || []), ...(perm.fields || [])]);

				if (info.fields.includes('*')) {
					info.fields = ['*'];
				}
			}

			if (perm.presets) {
				info.presets = { ...(info.presets ?? {}), ...perm.presets };
			}
		}

		// TODO add missing actions here with access: false, full_access: false?
		// TODO Should fields by null or undefined if no access?

		return infos;
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

		await Promise.all(
			Object.keys(itemPermissions).map((key) => {
				const action = key as keyof ItemPermissions;
				const checkAction = action === 'update' ? updateAction : action;

				if (!this.accountability) {
					itemPermissions[action].access = true;
					return Promise.resolve();
				}

				const opts: ValidateAccessOptions = {
					accountability: this.accountability,
					action: checkAction,
					collection,
				};

				if (primaryKey) {
					opts.primaryKeys = [primaryKey];
				}

				return validateAccess(opts, {
					schema: this.schema,
					knex: this.knex,
				})
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
