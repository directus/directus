import { Query } from '../types/query';
import * as ItemsService from './items';
import { Accountability } from '../types';

export const readSettings = async (query: Query) => {
	const settings = await ItemsService.readItems('directus_settings', {
		...query,
		limit: 1,
	});

	return settings[0];
};

export const updateSettings = async (
	pk: string | number,
	data: Record<string, any>,
	accountability: Accountability
) => {
	/** @NOTE I guess this can technically update _all_ items, as we expect there to only be one */
	return await ItemsService.updateItem('directus_settings', pk, data, accountability);
};
