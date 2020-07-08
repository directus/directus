import { Query } from '../types/query';
import * as ItemsService from './items';

export const createRelation = async (data: Record<string, any>, query: Query) => {
	const primaryKey = await ItemsService.createItem('directus_relations', data);
	return ItemsService.readItem('directus_relations', primaryKey, query);
};

export const readRelations = async (query: Query) => {
	return await ItemsService.readItems('directus_relations', query);
};

export const readRelation = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_relations', pk, query);
};

export const updateRelation = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	const primaryKey = await ItemsService.updateItem('directus_relations', pk, data);
	return ItemsService.readItem('directus_relations', primaryKey, query);
};

export const deleteRelation = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_relations', pk);
};
