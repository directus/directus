import { AbstractServiceOptions, PermissionsAction } from '../types';
import { ItemsService } from '../services/items';

export class PermissionsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_permissions', options);
	}

	async getAllowedCollections(role: string | null, action: PermissionsAction) {
		const query = this.knex.select('collection').from('directus_permissions').where({ role, action });
		const results = await query;
		return results.map((result) => result.collection);
	}

	async getAllowedFields(role: string | null, action: PermissionsAction, collection?: string) {
		const query = this.knex.select('collection', 'fields').from('directus_permissions').where({ role, action });

		if (collection) {
			query.andWhere({ collection });
		}

		const results = await query;

		const fieldsPerCollection: Record<string, string[]> = {};

		for (const result of results) {
			const { collection, fields } = result;
			if (!fieldsPerCollection[collection]) fieldsPerCollection[collection] = [];
			fieldsPerCollection[collection].push(...(fields || '').split(','));
		}

		return fieldsPerCollection;
	}
}
