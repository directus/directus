import { Query } from '../types/query';
import * as ItemsService from './items';

export const readSettings = async (pk: string | number, query: Query) => {
	const settings = await ItemsService.readItems('directus_settings', {
		...query,
		limit: 1,
	});

	return settings[0];
};

export const updateSettings = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	/** @NOTE I guess this can technically update _all_ items, as we expect there to only be one */
	const primaryKey = await ItemsService.updateItem('directus_settings', pk, data);
	return await ItemsService.readItem('directus_settings', primaryKey, query);
};
