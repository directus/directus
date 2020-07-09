import * as ItemsService from './items';
import { Accountability, Query } from '../types';

export const createFolder = async (
	data: Record<string, any>,
	accountability: Accountability
): Promise<string> => {
	return (await ItemsService.createItem('directus_folders', data, accountability)) as string;
};

export const readFolders = async (query: Query) => {
	return await ItemsService.readItems('directus_folders', query);
};

export const readFolder = async (pk: string, query: Query) => {
	return await ItemsService.readItem('directus_folders', pk, query);
};

export const updateFolder = async (
	pk: string,
	data: Record<string, any>,
	accountability: Accountability
): Promise<string> => {
	return (await ItemsService.updateItem('directus_folders', pk, data, accountability)) as string;
};

export const deleteFolder = async (pk: string, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_folders', pk, accountability);
};
