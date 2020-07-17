import { Accountability, Query, Item } from '../types';
import * as ItemsService from './items';

/** @todo check if we want to save activity for collection presets */

export const createCollectionPreset = async (
	data: Partial<Item>,
	accountability: Accountability
) => {
	return await ItemsService.createItem('directus_presets', data, accountability);
};

export const readCollectionPresets = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_presets', query, accountability);
};

export const readCollectionPreset = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	return await ItemsService.readItem('directus_presets', pk, query, accountability);
};

export const updateCollectionPreset = async (
	pk: string | number,
	data: Partial<Item>,
	accountability: Accountability
) => {
	return await ItemsService.updateItem('directus_presets', pk, data, accountability);
};

export const deleteCollectionPreset = async (
	pk: string | number,
	accountability: Accountability
) => {
	await ItemsService.deleteItem('directus_presets', pk, accountability);
};
