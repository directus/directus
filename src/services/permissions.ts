import { Query } from '../types/query';
import * as ItemsService from './items';

export const createPermission = async (data: Record<string, any>, query: Query) => {
	const primaryKey = await ItemsService.createItem('directus_permissions', data);
	return await ItemsService.readItem('directus_permissions', primaryKey, query);
};

export const readPermissions = async (query: Query) => {
	return await ItemsService.readItems('directus_permissions', query);
};

export const readPermission = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_permissions', pk, query);
};

export const updatePermission = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	const primaryKey = await ItemsService.updateItem('directus_permissions', pk, data);
	return await ItemsService.readItem('directus_permissions', primaryKey, query);
};

export const deletePermission = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_permissions', pk);
};
