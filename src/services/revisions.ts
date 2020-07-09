import { Query } from '../types/query';
import * as ItemsService from './items';

export const createRevision = async (data: Record<string, any>) => {
	return await ItemsService.createItem('directus_revisions', data);
};

export const readRevisions = async (query: Query) => {
	return await ItemsService.readItems('directus_revisions', query);
};

export const readRevision = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_revisions', pk, query);
};
