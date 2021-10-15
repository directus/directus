import { appAccessMinimalPermissions } from '../database/system-data/app-access-permissions';
import { ItemsService, QueryOptions } from '../services/items';
import { AbstractServiceOptions, Item, PrimaryKey } from '../types';
import { Query, PermissionsAction } from '@directus/shared/types';
import { filterItems } from '../utils/filter-items';

export class PermissionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);
	}

	getAllowedFields(action: PermissionsAction, collection?: string): Record<string, string[]> {
		const results = this.schema.permissions.filter((permission) => {
			let matchesCollection = true;

			if (collection) {
				matchesCollection = permission.collection === collection;
			}

			const matchesAction = permission.action === action;

			return collection ? matchesCollection && matchesAction : matchesAction;
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
}
