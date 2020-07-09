import { Accountability, Query } from '../types';
import * as ItemsService from './items';

export const createPermission = async (
	data: Record<string, any>,
	accountability: Accountability
): Promise<number> => {
	return (await ItemsService.createItem('directus_permissions', data, accountability)) as number;
};

export const readPermissions = async (query: Query) => {
	return await ItemsService.readItems('directus_permissions', query);
};

export const readPermission = async (pk: number, query: Query) => {
	return await ItemsService.readItem('directus_permissions', pk, query);
};

export const updatePermission = async (
	pk: number,
	data: Record<string, any>,
	accountability: Accountability
): Promise<number> => {
	return (await ItemsService.updateItem(
		'directus_permissions',
		pk,
		data,
		accountability
	)) as number;
};

export const deletePermission = async (pk: number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_permissions', pk, accountability);
};
