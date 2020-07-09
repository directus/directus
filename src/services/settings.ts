import { Query } from '../types/query';
import * as ItemsService from './items';
import { Accountability } from '../types';

export const readSettings = async (query: Query) => {
	return await ItemsService.readSingleton('directus_settings', query);
};

export const updateSettings = async (data: Record<string, any>, accountability: Accountability) => {
	return await ItemsService.upsertSingleton('directus_settings', data, accountability);
};
