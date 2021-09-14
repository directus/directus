import formatTitle from '@directus/format-title';
import axios, { AxiosResponse } from 'axios';
import exifr from 'exifr';
import { clone } from 'lodash';
import { extension } from 'mime-types';
import path from 'path';
import sharp from 'sharp';
import url from 'url';
import emitter from '../emitter';
import env from '../env';
import { ForbiddenException, ServiceUnavailableException } from '../exceptions';
import logger from '../logger';
import storage from '../storage';
import { AbstractServiceOptions, File, PrimaryKey } from '../types';
import { toArray } from '@directus/shared/utils';
import { ItemsService, MutationOptions } from './items';

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
	): Promise<PrimaryKey> {
		const payload = clone(data);

		if ('folder' in payload === false) {
			const settings = await this.knex.select('storage_default_folder').from('directus_settings').first();

			if (settings?.storage_default_folder) {
				payload.folder = settings.storage_default_folder;
			}
		}

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

		const fileExtension =
			path.extname(payload.filename_download) || (payload.type && '.' + extension(payload.type)) || '';

		payload.filename_disk = primaryKey + (fileExtension || '');

		if (!payload.type) {
			payload.type = 'application/octet-stream';
		}

		try {
			await storage.disk(data.storage).put(payload.filename_disk, stream, payload.type);
		} catch (err: any) {
			logger.warn(`Couldn't save file ${payload.filename_disk}`);
			logger.warn(err);
			throw new ServiceUnavailableException(`Couldn't save file ${payload.filename_disk}`, { service: 'files' });
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

			payload.metadata = {};

			try {
				payload.metadata = await exifr.parse(buffer.content, {
					icc: false,
					iptc: true,
					ifd1: true,
					interop: true,
					translateValues: true,
					reviveValues: true,
					mergeOutput: false,
				});
				if (payload.metadata?.iptc?.Headline) {
					payload.title = payload.metadata.iptc.Headline;
				}
				if (!payload.description && payload.metadata?.iptc?.Caption) {
					payload.description = payload.metadata.iptc.Caption;
				}
				if (payload.metadata?.iptc?.Keywords) {
					payload.tags = payload.metadata.iptc.Keywords;
				}
			} catch (err: any) {
				logger.warn(`Couldn't extract metadata from file`);
				logger.warn(err);
			}
		}

		// We do this in a service without accountability. Even if you don't have update permissions to the file,
		// we still want to be able to set the extracted values from the file on create
		const sudoService = new ItemsService('directus_files', {
			knex: this.knex,
			schema: this.schema,
		});

		await sudoService.updateOne(primaryKey, payload, { emitEvents: false });

		if (this.cache && env.CACHE_AUTO_PURGE) {
			await this.cache.clear();
		}

		emitter.emitAction(`files.upload`, {
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
	async importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey> {
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
		} catch (err: any) {
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

		return await this.uploadOne(fileResponse.data, payload);
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
		const files = await super.readMany(keys, { fields: ['id', 'storage'], limit: -1 });

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

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
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
	): Promise<PrimaryKey> {
		logger.warn('FilesService.upload is deprecated and will be removed before v9.0.0. Use uploadOne instead.');

		return await this.uploadOne(stream, data, primaryKey);
	}

	/**
	 * @deprecated Use `importOne` instead
	 */
	async import(importURL: string, body: Partial<File>): Promise<PrimaryKey> {
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
