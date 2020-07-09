import { Accountability, Query } from '../types';
import * as ItemsService from './items';

export const createRole = async (data: Record<string, any>, accountability: Accountability) => {
	return await ItemsService.createItem('directus_roles', data, accountability);
};

export const readRoles = async (query: Query) => {
	return await ItemsService.readItems('directus_roles', query);
};

export const readRole = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_roles', pk, query);
};

export const updateRole = async (
	pk: string | number,
	data: Record<string, any>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_roles', pk, data, accountability);
};

export const deleteRole = async (pk: string | number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_roles', pk, accountability);
};
