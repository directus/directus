import { Query, Item } from '../types/query';
import * as ItemsService from './items';
import { Accountability } from '../types';

export const readSettings = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readSingleton('directus_settings', query, accountability);
};

export const updateSettings = async (data: Partial<Item>, accountability: Accountability) => {
	return await ItemsService.upsertSingleton('directus_settings', data, accountability);
};
