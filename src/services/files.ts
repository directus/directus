import { Query } from '../types/query';
import * as ItemsService from './items';
import storage from '../storage';
import * as PayloadService from './payload';

export const createFile = async (
	stream: NodeJS.ReadableStream,
	data: Record<string, any>,
	query?: Query
) => {
	const payload = await PayloadService.processValues('create', 'directus_files', data);

	await ItemsService.createItem('directus_files', payload, query);

	// @todo type of stream in flydrive is wrong: https://github.com/Slynova-Org/flydrive/issues/145
	await storage.disk(data.storage).put(data.filename_disk, stream as any);
};

export const readFiles = async (query: Query) => {
	return await ItemsService.readItems('directus_files', query);
};

export const readFile = async (pk: string | number, query: Query) => {
	return await ItemsService.readItem('directus_files', pk, query);
};

export const updateFile = async (pk: string | number, data: Record<string, any>, query: Query) => {
	return await ItemsService.updateItem('directus_files', pk, data, query);
};

export const deleteFile = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_files', pk);
};
