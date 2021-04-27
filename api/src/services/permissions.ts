import { AbstractServiceOptions, PermissionsAction, Query, Item, PrimaryKey } from '../types';
import { ItemsService, MutationOptions, QueryOptions } from '../services/items';
import { filterItems } from '../utils/filter-items';
import logger from '../logger';

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

	/**
	 * @deprecated Use `readOne` or `readMany` instead
	 */
	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		logger.warn(
			'PermissionsService.readByKey is deprecated and will be removed before v9.0.0. Use readOne or readMany instead.'
		);

		if (Array.isArray(key)) return await this.readMany(key, query, { permissionsAction: action });
		return await this.readOne(key, query, { permissionsAction: action });
	}
}
