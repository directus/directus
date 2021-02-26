import { ItemsService } from './items';
import storage from '../storage';
import sharp from 'sharp';
import { parse as parseICC } from 'icc';
import parseEXIF from 'exif-reader';
import parseIPTC from '../utils/parse-iptc';
import { AbstractServiceOptions, File, PrimaryKey } from '../types';
import { clone } from 'lodash';
import cache from '../cache';
import { ForbiddenException } from '../exceptions';
import { toArray } from '../utils/to-array';
import { extension } from 'mime-types';
import path from 'path';
import env from '../env';
import logger from '../logger';

export class FilesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_files', options);
	}

	async upload(
		stream: NodeJS.ReadableStream,
		data: Partial<File> & { filename_download: string; storage: string },
		primaryKey?: PrimaryKey
	) {
		const payload = clone(data);

		if (primaryKey !== undefined) {
			await this.update(payload, primaryKey);

			// If the file you're uploading already exists, we'll consider this upload a replace. In that case, we'll
			// delete the previously saved file and thumbnails to ensure they're generated fresh
			const disk = storage.disk(payload.storage);

			for await (const file of disk.flatList(String(primaryKey))) {
				await disk.delete(file.path);
			}
		} else {
			primaryKey = await this.create(payload);
		}

		const fileExtension = (payload.type && extension(payload.type)) || path.extname(payload.filename_download);

		payload.filename_disk = primaryKey + '.' + fileExtension;

		if (!payload.type) {
			payload.type = 'application/octet-stream';
		}

		try {
			await storage.disk(data.storage).put(payload.filename_disk, stream);
		} catch (err) {
			logger.warn(`Couldn't save file ${payload.filename_disk}`);
			logger.warn(err);
		}

		const { size } = await storage.disk(data.storage).getStat(payload.filename_disk);
		payload.filesize = size;

		if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'].includes(payload.type)) {
			const buffer = await storage.disk(data.storage).getBuffer(payload.filename_disk);
			const meta = await sharp(buffer.content, {}).metadata();

			payload.width = meta.width;
			payload.height = meta.height;
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

		await sudoService.update(payload, primaryKey);

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return primaryKey;
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = toArray(key);
		let files = await super.readByKey(keys, { fields: ['id', 'storage'] });

		if (!files) {
			throw new ForbiddenException();
		}

		await super.delete(keys);

		files = toArray(files);

		for (const file of files) {
			const disk = storage.disk(file.storage);

			// Delete file + thumbnails
			for await (const { path } of disk.flatList(file.id)) {
				await disk.delete(path);
			}
		}

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return key;
	}
}
