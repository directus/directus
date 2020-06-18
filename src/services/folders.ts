import { Query } from '../types/query';
import * as ItemsService from './items';

export const createFolder = async (data: Record<string, any>, query: Query) => {
	return await ItemsService.createItem('directus_folders', data, query);
};

export const readFolders = async (query: Query) => {
	return await ItemsService.readItems('directus_folders', query);
};

export const readFolder = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_folders', pk, query);
};

export const updateFolder = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	return await ItemsService.updateItem('directus_folders', pk, data, query);
};

export const deleteFolder = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_folders', pk);
};
