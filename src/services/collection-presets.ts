import { Query } from '../types/query';
import * as ItemsService from './items';

export const createCollectionPreset = async (data: Record<string, any>, query: Query) => {
	const primaryKey = await ItemsService.createItem('directus_collection_presets', data);
	return await ItemsService.readItem('directus_collection_presets', primaryKey, query);
};

export const readCollectionPresets = async (query: Query) => {
	return await ItemsService.readItems('directus_collection_presets', query);
};

export const readCollectionPreset = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_collection_presets', pk, query);
};

export const updateCollectionPreset = async (
	pk: string | number,
	data: Record<string, any>,
	query: Query
) => {
	const primaryKey = await ItemsService.updateItem('directus_collection_presets', pk, data);
	return await ItemsService.readItem('directus_collection_presets', primaryKey, query);
};

export const deleteCollectionPreset = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_collection_presets', pk);
};
