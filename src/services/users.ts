import { Query } from '../types/query';
import * as ItemsService from './items';

export const createUser = async (data: Record<string, any>, query: Query) => {
	return await ItemsService.createItem('directus_users', data, query);
};

export const readUsers = async (query: Query) => {
	return await ItemsService.readItems('directus_users', query);
};

export const readUser = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_users', pk, query);
};

export const updateUser = async (pk: string | number, data: Record<string, any>, query: Query) => {
	return await ItemsService.updateItem('directus_users', pk, data, query);
};

export const deleteUser = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_users', pk);
};
