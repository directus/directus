import { ItemsService, MutationOptions } from './items';
import storage from '../storage';
import sharp from 'sharp';
import { parse as parseICC } from 'icc';
import parseEXIF from 'exif-reader';
import parseIPTC from '../utils/parse-iptc';
import { AbstractServiceOptions, File, PrimaryKey } from '../types';
import { clone } from 'lodash';
import cache from '../cache';
import { ForbiddenException, ServiceUnavailableException } from '../exceptions';
import { toArray } from '../utils/to-array';
import { extension } from 'mime-types';
import path from 'path';
import env from '../env';
import logger from '../logger';
import axios, { AxiosResponse } from 'axios';
import url from 'url';
import formatTitle from '@directus/format-title';
import { emitAsyncSafe } from '../emitter';

export class FilesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_files', options);
	}

	/**
	 * Upload a single new file to the configured storage adapter
	 */
	async uploadOne(
		stream: NodeJS.ReadableStream,
		data: Partial<File> & { filename_download: string; storage: string },
		primaryKey?: PrimaryKey
	) {
		const payload = clone(data);

		if (primaryKey !== undefined) {
			await this.updateOne(primaryKey, payload, { emitEvents: false });

			// If the file you're uploading already exists, we'll consider this upload a replace. In that case, we'll
			// delete the previously saved file and thumbnails to ensure they're generated fresh
			const disk = storage.disk(payload.storage);

			for await (const file of disk.flatList(String(primaryKey))) {
				await disk.delete(file.path);
			}
		} else {
			primaryKey = await this.createOne(payload, { emitEvents: false });
		}

		const fileExtension = (payload.type && extension(payload.type)) || path.extname(payload.filename_download);

		payload.filename_disk = primaryKey + '.' + fileExtension;

		if (!payload.type) {
			payload.type = 'application/octet-stream';
		}

		try {
			await storage.disk(data.storage).put(payload.filename_disk, stream, payload.type);
		} catch (err) {
			logger.warn(`Couldn't save file ${payload.filename_disk}`);
			logger.warn(err);
		}

		const { size } = await storage.disk(data.storage).getStat(payload.filename_disk);
		payload.filesize = size;

		if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'].includes(payload.type)) {
			const buffer = await storage.disk(data.storage).getBuffer(payload.filename_disk);
			const meta = await sharp(buffer.content, {}).metadata();

			if (meta.orientation && meta.orientation >= 5) {
				payload.height = meta.width;
				payload.width = meta.height;
			} else {
				payload.width = meta.width;
				payload.height = meta.height;
			}

			payload.filesize = meta.size;
			payload.metadata = {};

			if (meta.icc) {
				try {
					payload.metadata.icc = parseICC(meta.icc);
				} catch (err) {
					logger.warn(`Couldn't extract ICC information from file`);
					logger.warn(err);
				}
			}

			if (meta.exif) {
				try {
					payload.metadata.exif = parseEXIF(meta.exif);
				} catch (err) {
					logger.warn(`Couldn't extract EXIF information from file`);
					logger.warn(err);
				}
			}

			if (meta.iptc) {
				try {
					payload.metadata.iptc = parseIPTC(meta.iptc);
					payload.title = payload.title || payload.metadata.iptc.headline;
					payload.description = payload.description || payload.metadata.iptc.caption;
				} catch (err) {
					logger.warn(`Couldn't extract IPTC information from file`);
					logger.warn(err);
				}
			}
		}

		// We do this in a service without accountability. Even if you don't have update permissions to the file,
		// we still want to be able to set the extracted values from the file on create
		const sudoService = new ItemsService('directus_files', {
			knex: this.knex,
			schema: this.schema,
		});

		await sudoService.updateOne(primaryKey, payload, { emitEvents: false });

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		emitAsyncSafe(`files.upload`, {
			event: `files.upload`,
			accountability: this.accountability,
			collection: this.collection,
			item: primaryKey,
			action: 'upload',
			payload,
			schema: this.schema,
			database: this.knex,
		});

		return primaryKey;
	}

	/**
	 * Import a single file from an external URL
	 */
	async importOne(importURL: string, body: Partial<File>) {
		const fileCreatePermissions = this.schema.permissions.find(
			(permission) => permission.collection === 'directus_files' && permission.action === 'create'
		);

		if (this.accountability?.admin !== true && !fileCreatePermissions) {
			throw new ForbiddenException();
		}

		let fileResponse: AxiosResponse<NodeJS.ReadableStream>;

		try {
			fileResponse = await axios.get<NodeJS.ReadableStream>(importURL, {
				responseType: 'stream',
			});
		} catch (err) {
			logger.warn(`Couldn't fetch file from url "${importURL}"`);
			logger.warn(err);
			throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
				service: 'external-file',
			});
		}

		const parsedURL = url.parse(fileResponse.request.res.responseUrl);
		const filename = path.basename(parsedURL.pathname as string);

		const payload = {
			filename_download: filename,
			storage: toArray(env.STORAGE_LOCATIONS)[0],
			type: fileResponse.headers['content-type'],
			title: formatTitle(filename),
			...(body || {}),
		};

		return await this.upload(fileResponse.data, payload);
	}

	/**
	 * Delete a file
	 */
	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.deleteMany([key], opts);
		return key;
	}

	/**
	 * Delete multiple files
	 */
	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const files = await super.readMany(keys, { fields: ['id', 'storage'] });

		if (!files) {
			throw new ForbiddenException();
		}

		await super.deleteMany(keys);

		for (const file of files) {
			const disk = storage.disk(file.storage);

			// Delete file + thumbnails
			for await (const { path } of disk.flatList(file.id)) {
				await disk.delete(path);
			}
		}

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return keys;
	}

	/**
	 * @deprecated Use `uploadOne` instead
	 */
	async upload(
		stream: NodeJS.ReadableStream,
		data: Partial<File> & { filename_download: string; storage: string },
		primaryKey?: PrimaryKey
	) {
		logger.warn('FilesService.upload is deprecated and will be removed before v9.0.0. Use uploadOne instead.');

		return await this.uploadOne(stream, data, primaryKey);
	}

	/**
	 * @deprecated Use `importOne` instead
	 */
	async import(importURL: string, body: Partial<File>) {
		return await this.importOne(importURL, body);
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'FilesService.delete is deprecated and will be removed before v9.0.0. Use deleteOne or deleteMany instead.'
		);
		if (Array.isArray(key)) return await this.deleteMany(key);
		return await this.deleteOne(key);
	}
}
