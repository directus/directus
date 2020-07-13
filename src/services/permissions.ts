import { Accountability, Permission, Operation, Query } from '../types';
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

export const authorize = async (operation: Operation, collection: string, role?: string) => {
	const query: Query = {
		filter: {
			collection: {
				_eq: collection,
			},
			operation: {
				_eq: operation,
			},
		},
		limit: 1,
	};

	if (role) {
		query.filter.role = {
			_eq: role,
		};
	}

	const records = await ItemsService.readItems<Permission>('directus_permissions', query);

	return records[0];
};
