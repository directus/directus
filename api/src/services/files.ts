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

		if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/svg+xml'].includes(payload.type)) {
			const hasExif = payload.type !== 'image/svg+xml';

			const buffer = await storage.disk(data.storage).getBuffer(payload.filename_disk);
			const dimensions = await this.getImageDimensions(buffer.content);
			const metadata = hasExif ? await this.getImageExif(buffer.content) : null;

			payload.width = dimensions.width;
			payload.height = dimensions.height;
			payload.metadata = metadata;

			if (metadata?.iptc?.Headline) {
				payload.title = metadata.iptc.Headline;
			}
			if (!payload.description && metadata?.iptc?.Caption) {
				payload.description = metadata.iptc.Caption;
			}
			if (metadata?.iptc?.Keywords) {
				payload.tags = metadata.iptc.Keywords;
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

		emitter.emitAction(
			'files.upload',
			{
				payload,
				key: primaryKey,
				collection: this.collection,
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			}
		);

		return primaryKey;
	}

	/**
	 * Import a single file from an external URL
	 */
	async importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey> {
		const fileCreatePermissions = this.accountability?.permissions?.find(
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

	private async getImageDimensions(buffer: Buffer) {
		const meta = await sharp(buffer, {}).metadata();

		if (meta.orientation && meta.orientation >= 5) {
			return {
				height: meta.width,
				width: meta.height,
			};
		} else {
			return {
				width: meta.width,
				height: meta.height,
			};
		}
	}

	private async getImageExif(buffer: Buffer): Promise<File['metadata']> {
		try {
			return await exifr.parse(buffer, {
				icc: false,
				iptc: true,
				ifd1: true,
				interop: true,
				translateValues: true,
				reviveValues: true,
				mergeOutput: false,
			});
		} catch (err: any) {
			logger.warn(`Couldn't extract metadata from file`);
			logger.warn(err);
			return {};
		}
	}
}
