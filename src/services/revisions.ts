import * as ItemsService from './items';
import { Accountability, Query } from '../types';

export const createRevision = async (data: Record<string, any>) => {
	return await ItemsService.createItem('directus_revisions', data);
};

export const readRevisions = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_revisions', query, accountability);
};

export const readRevision = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_revisions', pk, query, accountability);
};
