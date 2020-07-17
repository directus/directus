import { Accountability, Query } from '../types';
import * as ItemsService from './items';

export const createRelation = async (data: Record<string, any>, accountability: Accountability) => {
	return await ItemsService.createItem('directus_relations', data, accountability);
};

export const readRelations = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_relations', query, accountability);
};

export const readRelation = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_relations', pk, query, accountability);
};

export const updateRelation = async (
	pk: string | number,
	data: Record<string, any>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_relations', pk, data, accountability);
};

export const deleteRelation = async (pk: number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_relations', pk, accountability);
};
