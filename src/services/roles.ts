import { Accountability, Query, Item } from '../types';
import * as ItemsService from './items';

export const createRole = async (data: Partial<Item>, accountability: Accountability) => {
	return await ItemsService.createItem('directus_roles', data, accountability);
};

export const readRoles = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_roles', query, accountability);
};

export const readRole = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_roles', pk, query, accountability);
};

export const updateRole = async (
	pk: string | number,
	data: Partial<Item>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_roles', pk, data, accountability);
};

export const deleteRole = async (pk: string | number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_roles', pk, accountability);
};
