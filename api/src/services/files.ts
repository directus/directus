import type { Readable } from 'node:stream';
import { PassThrough as PassThroughStream, Transform as TransformStream } from 'node:stream';
import zlib from 'node:zlib';
import path from 'path';
import url from 'url';
import { useEnv } from '@directus/env';
import { ContentTooLargeError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import formatTitle from '@directus/format-title';
import type {
	AbstractServiceOptions,
	BusboyFileStream,
	File,
	MutationOptions,
	PrimaryKey,
	Query,
	QueryOptions,
} from '@directus/types';
import { toArray } from '@directus/utils';
import type { AxiosResponse } from 'axios';
import encodeURL from 'encodeurl';
import { clone, cloneDeep } from 'lodash-es';
import { extension } from 'mime-types';
import { RESUMABLE_UPLOADS } from '../constants.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { getAxios } from '../request/index.js';
import { getStorage } from '../storage/index.js';
import { extractMetadata } from './files/lib/extract-metadata.js';
import { ItemsService } from './items.js';

const env = useEnv();
const logger = useLogger();

export class FilesService extends ItemsService<File> {
	constructor(options: AbstractServiceOptions) {
		super('directus_files', options);
	}

	/**
	 * Upload a single new file to the configured storage adapter
	 */
	async uploadOne(
		stream: BusboyFileStream | Readable,
		data: Partial<File> & { storage: string },
		primaryKey?: PrimaryKey,
		opts?: MutationOptions,
	): Promise<PrimaryKey> {
		const storage = await getStorage();

		let existingFile: Record<string, any> | null = null;

		// If the payload contains a primary key, we'll check if the file already exists
		if (primaryKey !== undefined) {
			// If the file you're uploading already exists, we'll consider this upload a replace so we'll fetch the existing file's folder and filename_download
			existingFile =
				(await this.knex
					.select('folder', 'filename_download', 'filename_disk', 'title', 'description', 'metadata')
					.from('directus_files')
					.where({ id: primaryKey })
					.first()) ?? null;
		}

		// Merge the existing file's folder and filename_download with the new payload
		const payload = { ...(existingFile ?? {}), ...clone(data) };

		const disk = storage.location(payload.storage);

		// If no folder is specified, we'll use the default folder from the settings if it exists
		if ('folder' in payload === false) {
			const settings = await this.knex.select('storage_default_folder').from('directus_settings').first();

			if (settings?.storage_default_folder) {
				payload.folder = settings.storage_default_folder;
			}
		}

		// Is this file a replacement? if the file data already exists and we have a primary key
		const isReplacement = existingFile !== null && primaryKey !== undefined;

		// If this is a new file upload, we need to generate a new primary key and DB record
		if (isReplacement === false || primaryKey === undefined) {
			primaryKey = await this.createOne(payload, { emitEvents: false });
		}

		const fileExtension =
			path.extname(payload.filename_download!) || (payload.type && '.' + extension(payload.type)) || '';

		const filenameDisk = primaryKey + (fileExtension || '');

		// The filename_disk is the FINAL filename on disk
		payload.filename_disk ||= filenameDisk;

		// If the filename_disk extension doesn't match the new mimetype, update it
		if (isReplacement === true && path.extname(payload.filename_disk!) !== fileExtension) {
			payload.filename_disk = filenameDisk;
		}

		// Temp filename is used for replacements
		const tempFilenameDisk = 'temp_' + filenameDisk;

		if (!payload.type) {
			payload.type = 'application/octet-stream';
		}

		// Used to clean up if something goes wrong
		const cleanUp = async () => {
			try {
				if (isReplacement === true) {
					// If this is a replacement that failed, we need to delete the temp file
					await disk.delete(tempFilenameDisk);
				} else {
					// If this is a new file that failed
					// delete the DB record
					await super.deleteMany([primaryKey!]);

					// delete the final file
					await disk.delete(payload.filename_disk!);
				}
			} catch (err: any) {
				if (isReplacement === true) {
					logger.warn(`Couldn't delete temp file ${tempFilenameDisk}`);
				} else {
					logger.warn(`Couldn't delete file ${payload.filename_disk}`);
				}

				logger.warn(err);
			}
		};

		try {
			// If this is a replacement, we'll write the file to a temp location first to ensure we don't overwrite the existing file if something goes wrong
			if (isReplacement === true) {
				await disk.write(tempFilenameDisk, stream, payload.type);
			} else {
				// If this is a new file upload, we'll write the file to the final location
				await disk.write(payload.filename_disk, stream, payload.type);
			}

			// Check if the file was truncated (if the stream ended early) and throw limit error if it was
			if ('truncated' in stream && stream.truncated === true) {
				throw new ContentTooLargeError();
			}
		} catch (err: any) {
			logger.warn(`Couldn't save file ${payload.filename_disk}`);
			logger.warn(err);

			await cleanUp();

			if (err instanceof ContentTooLargeError) {
				throw err;
			} else {
				throw new ServiceUnavailableError({ service: 'files', reason: `Couldn't save file ${payload.filename_disk}` });
			}
		}

		// If the file is a replacement, we need to update the DB record with the new payload, delete the old files, and upgrade the temp file
		if (isReplacement === true) {
			try {
				await this.updateOne(primaryKey, payload, { emitEvents: false });

				// delete the previously saved file and thumbnails to ensure they're generated fresh
				for await (const filepath of disk.list(String(primaryKey))) {
					await disk.delete(filepath);
				}

				// Upgrade the temp file to the final filename
				await disk.move(tempFilenameDisk, payload.filename_disk);
			} catch (err: any) {
				await cleanUp();
				throw err;
			}
		}

		const { size } = await storage.location(data.storage).stat(payload.filename_disk);
		payload.filesize = size;

		const metadata = await extractMetadata(data.storage, payload as Parameters<typeof extractMetadata>[1]);

		payload.uploaded_on = new Date().toISOString();

		// We do this in a service without accountability. Even if you don't have update permissions to the file,
		// we still want to be able to set the extracted values from the file on create
		const sudoFilesItemsService = new ItemsService('directus_files', {
			knex: this.knex,
			schema: this.schema,
		});

		await sudoFilesItemsService.updateOne(primaryKey, { ...payload, ...metadata }, { emitEvents: false });

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
				},
			);
		}

		return primaryKey;
	}

	/**
	 * Extract metadata from a buffer's content
	 */

	/**
	 * Import a single file from an external URL
	 */
	async importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey> {
		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'create',
					collection: 'directus_files',
				},
				{
					knex: this.knex,
					schema: this.schema,
				},
			);
		}

		let fileResponse;

		try {
			const axios = await getAxios();

			fileResponse = await axios.get<Readable>(encodeURL(importURL), {
				responseType: 'stream',
				decompress: false,
			});
		} catch (error: any) {
			logger.warn(`Couldn't fetch file from URL "${importURL}"${error.message ? `: ${error.message}` : ''}`);
			logger.trace(error);

			throw new ServiceUnavailableError({
				service: 'external-file',
				reason: `Couldn't fetch file from URL "${importURL}"`,
			});
		}

		const parsedURL = url.parse(fileResponse.request.res.responseUrl);
		const filename = decodeURI(path.basename(parsedURL.pathname as string));

		const payload = {
			filename_download: filename,
			storage: toArray(env['STORAGE_LOCATIONS'] as string)[0]!,
			type: fileResponse.headers['content-type'],
			title: formatTitle(filename),
			...(body || {}),
		};

		return await this.uploadOne(decompressResponse(fileResponse.data, fileResponse.headers), payload, payload.id);
	}

	/**
	 * Create a file (only applicable when it is not a multipart/data POST request)
	 * Useful for associating metadata with existing file in storage
	 */
	override async createOne(data: Partial<File>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!data.type) {
			throw new InvalidPayloadError({ reason: `"type" is required` });
		}

		const key = await super.createOne(data, opts);
		return key;
	}

	/**
	 * Delete multiple files
	 */
	override async deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]> {
		const storage = await getStorage();

		const sudoFilesItemsService = new FilesService({
			knex: this.knex,
			schema: this.schema,
		});

		const files = await sudoFilesItemsService.readMany(keys, { fields: ['id', 'storage', 'filename_disk'], limit: -1 });

		await super.deleteMany(keys);

		for (const file of files) {
			const disk = storage.location(file['storage']);
			const filePrefix = path.parse(file['filename_disk']).name;

			// Delete file + thumbnails
			for await (const filepath of disk.list(filePrefix)) {
				await disk.delete(filepath);
			}
		}

		return keys;
	}

	override async readByQuery(query: Query, opts?: QueryOptions | undefined) {
		const filteredQuery = cloneDeep(query);

		if (RESUMABLE_UPLOADS.ENABLED === true) {
			const filterPartialUploads = { tus_id: { _null: true } };

			if (!filteredQuery.filter) {
				filteredQuery.filter = filterPartialUploads;
			} else if ('_and' in filteredQuery.filter && Array.isArray(filteredQuery.filter['_and'])) {
				filteredQuery.filter['_and'].push(filterPartialUploads);
			} else {
				filteredQuery.filter = {
					_and: [filteredQuery.filter, filterPartialUploads],
				};
			}
		}

		return super.readByQuery(filteredQuery, opts);
	}
}

function decompressResponse(stream: Readable, headers: AxiosResponse['headers']) {
	const contentEncoding = (headers['content-encoding'] || '').toLowerCase();

	if (!['gzip', 'deflate', 'br'].includes(contentEncoding)) {
		return stream;
	}

	let isEmpty = true;

	const checker = new TransformStream({
		transform(data, _encoding, callback) {
			if (isEmpty === false) {
				callback(null, data);
				return;
			}

			isEmpty = false;

			handleContentEncoding(data);

			callback(null, data);
		},

		flush(callback) {
			callback();
		},
	});

	const finalStream = new PassThroughStream({
		autoDestroy: false,
		destroy(error, callback) {
			stream.destroy();

			callback(error);
		},
	});

	stream.pipe(checker);

	return finalStream;

	function handleContentEncoding(data: any) {
		let decompressStream;

		if (contentEncoding === 'br') {
			decompressStream = zlib.createBrotliDecompress();
		} else if (contentEncoding === 'deflate' && isDeflateAlgorithm(data)) {
			decompressStream = zlib.createInflateRaw();
		} else {
			decompressStream = zlib.createUnzip();
		}

		decompressStream.once('error', (error) => {
			if (isEmpty && !stream.readable) {
				finalStream.end();
				return;
			}

			finalStream.destroy(error);
		});

		checker.pipe(decompressStream).pipe(finalStream);
	}

	function isDeflateAlgorithm(data: any) {
		const DEFLATE_ALGORITHM_HEADER = 0x08;

		return data.length > 0 && (data[0] & DEFLATE_ALGORITHM_HEADER) === 0;
	}
}
