import { AbstractServiceOptions, PermissionsAction } from '../types';
import { ItemsService } from '../services/items';

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
}
