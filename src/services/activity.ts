import * as ItemsService from './items';
import { Accountability, Item, Query, PrimaryKey } from '../types';

export enum Action {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERT = 'revert',
	COMMENT = 'comment',
	UPLOAD = 'upload',
	AUTHENTICATE = 'authenticate',
}

export const createActivity = async (data: Partial<Item>) => {
	return await ItemsService.createItem('directus_activity', data);
};

export const readActivities = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_activity', query, accountability);
};

export const readActivity = async (
	primaryKey: PrimaryKey,
	query: Query = {},
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_activity', primaryKey, query, accountability);
};

export const updateActivity = async (
	pk: string | number,
	data: Partial<Item>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_activity', pk, data, accountability);
};

export const deleteActivity = async (pk: string | number, accountability?: Accountability) => {
	return await ItemsService.deleteItem('directus_activity', pk, accountability);
};
