import { Query } from '../types/query';
import * as ItemsService from './items';

export enum Action {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
	REVERT = 'revert',
	COMMENT = 'comment',
	UPLOAD = 'upload',
	AUTHENTICATE = 'authenticate',
}

export const createActivity = async (data: Record<string, any>, query?: Query) => {
	const primaryKey = await ItemsService.createItem('directus_activity', data);
	return await ItemsService.readItem('directus_activity', primaryKey, query);
};

export const readActivities = async (query?: Query) => {
	return await ItemsService.readItems('directus_activity', query);
};

export const readActivity = async (pk: string | number, query?: Query) => {
	return await ItemsService.readItem('directus_activity', pk, query);
};
