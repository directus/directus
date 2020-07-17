import { Query } from '../types/query';
import * as ItemsService from './items';
import { Accountability } from '../types';

export enum Action {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERT = 'revert',
	COMMENT = 'comment',
	UPLOAD = 'upload',
	AUTHENTICATE = 'authenticate',
}

export const createActivity = async (data: Record<string, any>) => {
	return await ItemsService.createItem('directus_activity', data);
};

export const readActivities = async (query?: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_activity', query, accountability);
};

export const readActivity = async (
	pk: string | number,
	query?: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_activity', pk, query, accountability);
};

export const updateActivity = async (
	pk: string | number,
	data: Record<string, any>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_activity', pk, data, accountability);
};

export const deleteActivity = async (pk: string | number, accountability?: Accountability) => {
	return await ItemsService.deleteItem('directus_activity', pk, accountability);
};
