import { Query } from '../types/query';
import * as ItemsService from './items';

export const readSettings = async (pk: string | number, query: Query) => {
	/** @TODO only fetch the one item that exists, or default to default values if it doesn't */
	return await ItemsService.readItem('directus_settings', pk, query);
};

export const updateSettings = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	/** @NOTE I guess this can technically update _all_ items, as we expect there to only be one */
	return await ItemsService.updateItem('directus_settings', pk, data, query);
};
