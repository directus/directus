import { Query } from '../types/query';
import * as ItemsService from './items';

/** @TODO This is a little more involved ofc, circling back later */
// export const createFile = async (data: Record<string, any>, query: Query) => {
// 	return await ItemsService.createItem('directus_files', data, query);
// };

export const readFiles = async (query: Query) => {
	return await ItemsService.readItems('directus_files', query);
};

export const readFile = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_files', pk, query);
};

export const updateFile = async (pk: string | number, data: Record<string, any>, query: Query) => {
	return await ItemsService.updateItem('directus_files', pk, data, query);
};

export const deleteFile = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_files', pk);
};
