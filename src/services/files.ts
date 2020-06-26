import { Query } from '../types/query';
import * as ItemsService from './items';
import storage from '../storage';
import * as PayloadService from './payload';
import database from '../database';
import logger from '../logger';

export const createFile = async (
	data: Record<string, any>,
	stream: NodeJS.ReadableStream,
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

// @todo Add query support
export const updateFile = async (
	pk: string | number,
	data: Record<string, any>,
	stream?: NodeJS.ReadableStream,
	query?: Query
) => {
	const payload = await PayloadService.processValues('update', 'directus_files', data);
	await ItemsService.updateItem('directus_files', pk, payload, query);

	/**
	 * @TODO
	 * Handle changes in storage adapter -> going from local to S3 needs to delete from one, upload to the other
	 */

	if (stream) {
		const file = await database
			.select('storage', 'filename_disk')
			.from('directus_files')
			.where({ id: pk })
			.first();

		// @todo type of stream in flydrive is wrong: https://github.com/Slynova-Org/flydrive/issues/145
		await storage.disk(file.storage).put(file.filename_disk, stream as any);
	}
};

export const deleteFile = async (pk: string | number) => {
	const file = await database
		.select('storage', 'filename_disk')
		.from('directus_files')
		.where({ id: pk })
		.first();
	const { wasDeleted } = await storage.disk(file.storage).delete(file.filename_disk);
	logger.info(`File ${file.filename_download} deleted: ${wasDeleted}`);
	await database.delete().from('directus_files').where({ id: pk });
};
