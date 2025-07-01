import { ForbiddenError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Item,
	ItemPermissions,
	MutationOptions,
	Permission,
	PrimaryKey,
	Query,
	QueryOptions,
} from '@directus/types';
import { uniq } from 'lodash-es';
import { clearSystemCache } from '../cache.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { withAppMinimalPermissions } from '../permissions/lib/with-app-minimal-permissions.js';
import type { ValidateAccessOptions } from '../permissions/modules/validate-access/validate-access.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { ItemsService } from './items.js';

export class PermissionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);
	}

	private async clearCaches(opts?: MutationOptions) {
		await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });

		if (this.cache && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}
	}

	override async readByQuery(query: Query, opts?: QueryOptions): Promise<Partial<Item>[]> {
		const result = (await super.readByQuery(query, opts)) as Permission[];

		return withAppMinimalPermissions(this.accountability, result, query.filter);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.createOne(data, opts);

		await this.clearCaches(opts);

		return res;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.createMany(data, opts);

		await this.clearCaches(opts);

		return res;
	}

	override async updateBatch(data: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.updateBatch(data, opts);

		await this.clearCaches(opts);

		return res;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions) {
		const res = await super.updateMany(keys, data, opts);

		await this.clearCaches(opts);

		return res;
	}

	override async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions) {
		const res = await super.upsertMany(payloads, opts);

		await this.clearCaches(opts);

		return res;
	}

	override async deleteMany(keys: PrimaryKey[], opts?: MutationOptions) {
		const res = await super.deleteMany(keys, opts);

		await this.clearCaches(opts);

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
			const context = { schema: this.schema, knex: this.knex };
			const policies = await fetchPolicies(this.accountability, context);

			const permissions = await fetchPermissions(
				{ policies, accountability: this.accountability, action: updateAction, collections: [collection] },
				context,
			);

			let fields: string[] = [];
			let presets = {};

			for (const permission of permissions) {
				if (permission.fields && fields[0] !== '*') {
					fields = uniq([...fields, ...permission.fields]);

					if (fields.includes('*')) {
						fields = ['*'];
					}
				}

				if (permission.presets) {
					presets = { ...(presets ?? {}), ...permission.presets };
				}
			}

			itemPermissions.update.fields = fields;
			itemPermissions.update.presets = presets;
		}

		return itemPermissions;
	}
}
