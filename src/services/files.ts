import { Query } from '../types/query';
import ItemsService from './items';
import storage from '../storage';
import database from '../database';
import logger from '../logger';
import sharp from 'sharp';
import { parse as parseICC } from 'icc';
import parseEXIF from 'exif-reader';
import parseIPTC from '../utils/parse-iptc';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Accountability, Item } from '../types';
import { Readable } from 'stream';

export const createFile = async (
	data: Partial<Item>,
	stream: NodeJS.ReadableStream,
	accountability?: Accountability
) => {
	const id = uuidv4();
	const itemsService = new ItemsService('directus_files', { accountability });

	const payload: Partial<Item> = {
		...data,
		id,
	};

	payload.filename_disk = payload.id + path.extname(payload.filename_download);

	/**
	 * @note
	 * We save a subset first. This allows the permissions check to run and the file to be created with
	 * proper accountability and revisions.
	 * Afterwards, we'll save the file to disk. During this process, we extract the metadata of the
	 * file itself. After the file is saved to disk, we'll update the just created item with the
	 * updated values to ensure we save the filesize etc. We explicitly save this without accountability
	 * in order to prevent update permissions to kick in and to pervent an extra revision from being created
	 */
	const pk = await itemsService.create(payload);

	const pipeline = sharp();

	if (payload.type?.startsWith('image')) {
		pipeline.metadata().then((meta) => {
			payload.width = meta.width;
			payload.height = meta.height;
			payload.filesize = meta.size;
			payload.metadata = {};

			if (meta.icc) {
				payload.metadata.icc = parseICC(meta.icc);
			}

			if (meta.exif) {
				payload.metadata.exif = parseEXIF(meta.exif);
			}

			if (meta.iptc) {
				payload.metadata.iptc = parseIPTC(meta.iptc);

				payload.title = payload.title || payload.metadata.iptc.headline;
				payload.description = payload.description || payload.metadata.iptc.caption;
			}
		});
	}

	if (!payload.title) {
		payload.title = payload.id;
	}

	await storage.disk(data.storage).put(payload.filename_disk, stream.pipe(pipeline));
	await itemsService.update(payload, pk);

	return pk;
};

export const readFiles = async (query: Query, accountability?: Accountability) => {
	const itemsService = new ItemsService('directus_files', { accountability });
	return await itemsService.readByQuery(query);
};

export const readFile = async (
	pk: string | number,
	query: Query,
	accountability?: Accountability
) => {
	const itemsService = new ItemsService('directus_files', { accountability });
	return await itemsService.readByKey(pk, query);
};

export const updateFile = async (
	pk: string | number,
	data: Partial<Item>,
	accountability?: Accountability,
	stream?: NodeJS.ReadableStream
) => {
	const itemsService = new ItemsService('directus_files', { accountability });

	/**
	 * @TODO
	 * Handle changes in storage adapter -> going from local to S3 needs to delete from one, upload to the other
	 */

	/**
	 * @TODO
	 * Remove old thumbnails
	 */

	/**
	 * @TODO
	 * Extract metadata here too
	 */

	if (stream) {
		const file = await database
			.select('storage', 'filename_disk')
			.from('directus_files')
			.where({ id: pk })
			.first();

		await storage.disk(file.storage).put(file.filename_disk, stream as Readable);
	}

	return await itemsService.update(data, pk);
};

export const deleteFile = async (pk: string, accountability?: Accountability) => {
	/** @todo use ItemsService */
	const file = await database
		.select('storage', 'filename_disk')
		.from('directus_files')
		.where({ id: pk })
		.first();

	/** @todo delete thumbnails here. should be able to use storage.disk().flatList(prefix: string) */
	const { wasDeleted } = await storage.disk(file.storage).delete(file.filename_disk);

	logger.info(`File ${file.filename_download} deleted: ${wasDeleted}`);

	/** @todo use itemsService */
	await database.delete().from('directus_files').where({ id: pk });
};
