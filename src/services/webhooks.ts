import { Accountability, Query } from '../types';
import * as ItemsService from './items';

export const createWebhook = async (data: Record<string, any>, accountability: Accountability) => {
	return await ItemsService.createItem('directus_webhooks', data, accountability);
};

export const readWebhooks = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_webhooks', query, accountability);
};

export const readWebhook = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_webhooks', pk, query, accountability);
};

export const updateWebhook = async (
	pk: string | number,
	data: Record<string, any>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_webhooks', pk, data, accountability);
};

export const deleteWebhook = async (pk: string | number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_webhooks', pk, accountability);
};
