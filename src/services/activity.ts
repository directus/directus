import { Query } from '../types/query';
import * as ItemsService from './items';

export const readActivities = async (query: Query) => {
	return await ItemsService.readItems('directus_activity', query);
};

export const readActivity = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_activity', pk, query);
};
