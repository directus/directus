import { toArray } from '@directus/shared/utils';
import { lookup } from 'dns';
import encodeURL from 'encodeurl';
import exif from 'exif-reader';
import { parse as parseIcc } from 'icc';
import { clone, pick } from 'lodash';
import { extension } from 'mime-types';
import net from 'net';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import url, { URL } from 'url';
import { promisify } from 'util';
import emitter from '../emitter';
import env from '../env';
import { ForbiddenException, InvalidPayloadException, ServiceUnavailableException } from '../exceptions';
import logger from '../logger';
import { getStorage } from '../storage';
import { AbstractServiceOptions, File, Metadata, MutationOptions, PrimaryKey } from '../types';
import { parseIptc, parseXmp } from '../utils/parse-image-metadata';
import { ItemsService } from './items';

// @ts-ignore
import formatTitle from '@directus/format-title';

const lookupDNS = promisify(lookup);

export class FilesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_files', options);
	}

	/**
	 * Upload a single new file to the configured storage adapter
	 */
	async uploadOne(
		stream: Readable,
		data: Partial<File> & { filename_download: string; storage: string },
		primaryKey?: PrimaryKey,
		opts?: MutationOptions
	): Promise<PrimaryKey> {
		const storage = await getStorage();

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
			const disk = storage.location(payload.storage);

			for await (const filepath of disk.list(String(primaryKey))) {
				await disk.delete(filepath);
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
			await storage.location(data.storage).write(payload.filename_disk, stream, payload.type);
		} catch (err: any) {
			logger.warn(`Couldn't save file ${payload.filename_disk}`);
			logger.warn(err);
			throw new ServiceUnavailableException(`Couldn't save file ${payload.filename_disk}`, { service: 'files' });
		}

		const { size } = await storage.location(data.storage).stat(payload.filename_disk);
		payload.filesize = size;

		if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'].includes(payload.type)) {
			const stream = await storage.location(data.storage).read(payload.filename_disk);
			const { height, width, description, title, tags, metadata } = await this.getMetadata(stream);

			payload.height ??= height;
			payload.width ??= width;
			payload.description ??= description;
			payload.title ??= title;
			payload.tags ??= tags;
			payload.metadata ??= metadata;
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

		if (opts?.emitEvents !== false) {
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
		}

		return primaryKey;
	}

	/**
	 * Extract metadata from a buffer's content
	 */
	async getMetadata(stream: Readable, allowList = env.FILE_METADATA_ALLOW_LIST): Promise<Metadata> {
		return new Promise((resolve, reject) => {
			pipeline(
				stream,
				sharp().metadata(async (err, sharpMetadata) => {
					if (err) reject(err);

					const metadata: Metadata = {};

					if (sharpMetadata.orientation && sharpMetadata.orientation >= 5) {
						metadata.height = sharpMetadata.width;
						metadata.width = sharpMetadata.height;
					} else {
						metadata.width = sharpMetadata.width;
						metadata.height = sharpMetadata.height;
					}

					// Backward-compatible layout as it used to be with 'exifr'
					const fullMetadata: {
						ifd0?: Record<string, unknown>;
						ifd1?: Record<string, unknown>;
						exif?: Record<string, unknown>;
						gps?: Record<string, unknown>;
						interop?: Record<string, unknown>;
						icc?: Record<string, unknown>;
						iptc?: Record<string, unknown>;
						xmp?: Record<string, unknown>;
					} = {};
					if (sharpMetadata.exif) {
						const { image, thumbnail, interoperability, ...rest } = exif(sharpMetadata.exif);
						if (image) {
							fullMetadata.ifd0 = image;
						}
						if (thumbnail) {
							fullMetadata.ifd1 = thumbnail;
						}
						if (interoperability) {
							fullMetadata.interop = interoperability;
						}
						Object.assign(fullMetadata, rest);
					}
					if (sharpMetadata.icc) {
						fullMetadata.icc = parseIcc(sharpMetadata.icc);
					}
					if (sharpMetadata.iptc) {
						fullMetadata.iptc = parseIptc(sharpMetadata.iptc);
					}
					if (sharpMetadata.xmp) {
						fullMetadata.xmp = parseXmp(sharpMetadata.xmp);
					}

					if (fullMetadata?.iptc?.Caption && typeof fullMetadata.iptc.Caption === 'string') {
						metadata.description = fullMetadata.iptc?.Caption;
					}
					if (fullMetadata?.iptc?.Headline && typeof fullMetadata.iptc.Headline === 'string') {
						metadata.title = fullMetadata.iptc.Headline;
					}
					if (fullMetadata?.iptc?.Keywords) {
						metadata.tags = fullMetadata.iptc.Keywords;
					}

					if (allowList === '*' || allowList?.[0] === '*') {
						metadata.metadata = fullMetadata;
					} else {
						metadata.metadata = pick(fullMetadata, allowList);
					}

					// Fix (incorrectly parsed?) values starting / ending with spaces,
					// limited to one level and string values only
					for (const section of Object.keys(metadata.metadata)) {
						for (const [key, value] of Object.entries(metadata.metadata[section])) {
							if (typeof value === 'string') {
								metadata.metadata[section][key] = value.trim();
							}
						}
					}

					resolve(metadata);
				})
			);
		});
	}

	/**
	 * Import a single file from an external URL
	 */
	async importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey> {
		const axios = (await import('axios')).default;

		const fileCreatePermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === 'directus_files' && permission.action === 'create'
		);

		if (this.accountability && this.accountability?.admin !== true && !fileCreatePermissions) {
			throw new ForbiddenException();
		}

		let resolvedUrl;

		try {
			resolvedUrl = new URL(importURL);
		} catch (err: any) {
			logger.warn(err, `Requested URL ${importURL} isn't a valid URL`);
			throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
				service: 'external-file',
			});
		}

		let ip = resolvedUrl.hostname;

		if (net.isIP(ip) === 0) {
			try {
				ip = (await lookupDNS(ip)).address;
			} catch (err: any) {
				logger.warn(err, `Couldn't lookup the DNS for url ${importURL}`);
				throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
					service: 'external-file',
				});
			}
		}

		if (env.IMPORT_IP_DENY_LIST.includes('0.0.0.0')) {
			const networkInterfaces = os.networkInterfaces();

			for (const networkInfo of Object.values(networkInterfaces)) {
				if (!networkInfo) continue;

				for (const info of networkInfo) {
					if (info.address === ip) {
						logger.warn(`Requested URL ${importURL} resolves to localhost.`);
						throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
							service: 'external-file',
						});
					}
				}
			}
		}

		if (env.IMPORT_IP_DENY_LIST.includes(ip)) {
			logger.warn(`Requested URL ${importURL} resolves to a denied IP address.`);
			throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
				service: 'external-file',
			});
		}

		let fileResponse;

		try {
			fileResponse = await axios.get<Readable>(encodeURL(importURL), {
				responseType: 'stream',
			});
		} catch (err: any) {
			logger.warn(err, `Couldn't fetch file from url "${importURL}"`);
			throw new ServiceUnavailableException(`Couldn't fetch file from url "${importURL}"`, {
				service: 'external-file',
			});
		}

		const parsedURL = url.parse(fileResponse.request.res.responseUrl);
		const filename = decodeURI(path.basename(parsedURL.pathname as string));

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
	 * Create a file (only applicable when it is not a multipart/data POST request)
	 * Useful for associating metadata with existing file in storage
	 */
	async createOne(data: Partial<File>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!data.type) {
			throw new InvalidPayloadException(`"type" is required`);
		}

		const key = await super.createOne(data, opts);
		return key;
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
		const storage = await getStorage();
		const files = await super.readMany(keys, { fields: ['id', 'storage'], limit: -1 });

		if (!files) {
			throw new ForbiddenException();
		}

		await super.deleteMany(keys);

		for (const file of files) {
			const disk = storage.location(file.storage);

			// Delete file + thumbnails
			for await (const filepath of disk.list(file.id)) {
				await disk.delete(filepath);
			}
		}

		if (this.cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return keys;
	}
}
