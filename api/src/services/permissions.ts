import { AbstractServiceOptions, PermissionsAction, Query, Item, PrimaryKey } from '../types';
import { ItemsService } from '../services/items';
import { filterItems } from '../utils/filter-items';

import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';

export class PermissionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);
	}

	getAllowedFields(action: PermissionsAction, collection?: string) {
		const results = this.schema.permissions.filter((permission) => {
			let matchesCollection = true;

			if (collection) {
				matchesCollection = permission.collection === collection;
			}

			return permission.action === action;
		});

		const fieldsPerCollection: Record<string, string[]> = {};

		for (const result of results) {
			const { collection, fields } = result;
			if (!fieldsPerCollection[collection]) fieldsPerCollection[collection] = [];
			fieldsPerCollection[collection].push(...(fields ?? []));
		}

		return fieldsPerCollection;
	}

	async readByQuery(
		query: Query,
		opts?: { stripNonRequested?: boolean }
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		const result = await super.readByQuery(query, opts);

		if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
			result.push(...filterItems(appAccessMinimalPermissions, query.filter));
		}

		return result;
	}

	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		const result = await super.readByKey(key as any, query, action);

		if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
			result.push(...filterItems(appAccessMinimalPermissions, query.filter));
		}

		return result;
	}
}
