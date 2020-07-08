import { Query } from '../types/query';
import * as ItemsService from './items';

export const createWebhook = async (data: Record<string, any>, query: Query) => {
	const primaryKey = await ItemsService.createItem('directus_webhooks', data);
	return await ItemsService.readItem('directus_webhooks', primaryKey, query);
};

export const readWebhooks = async (query: Query) => {
	return await ItemsService.readItems('directus_webhooks', query);
};

export const readWebhook = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_webhooks', pk, query);
};

export const updateWebhook = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	const primaryKey = await ItemsService.updateItem('directus_webhooks', pk, data);
	return await ItemsService.readItem('directus_webhooks', primaryKey, query);
};

export const deleteWebhook = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_webhooks', pk);
};
