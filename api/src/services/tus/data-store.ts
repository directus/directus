import { extname } from 'node:path';
import stream from 'node:stream';
import formatTitle from '@directus/format-title';
import type { TusDriver } from '@directus/storage';
import type { Accountability, ChunkedUploadContext, File, SchemaOverview } from '@directus/types';
import { DataStore, ERRORS, Upload } from '@tus/utils';
import { omit } from 'lodash-es';
import { extension } from 'mime-types';
import getDatabase from '../../database/index.js';
import { useLogger } from '../../logger/index.js';
import { ItemsService } from '../items.js';

export type TusDataStoreConfig = {
	constants: {
		ENABLED: boolean;
		CHUNK_SIZE: number | null;
		MAX_SIZE: number | null;
		EXPIRATION_TIME: number;
		SCHEDULE: string;
	};
	/** Storage location name **/
	location: string;
	driver: TusDriver;

	schema: SchemaOverview;
	accountability: Accountability | undefined;
};

export class TusDataStore extends DataStore {
	protected chunkSize: number | undefined;
	protected maxSize: number | undefined;
	protected expirationTime: number;
	protected location: string;
	protected storageDriver: TusDriver;
	protected schema: SchemaOverview;
	protected accountability: Accountability | undefined;

	constructor(config: TusDataStoreConfig) {
		super();

		if (config.constants.CHUNK_SIZE !== null) this.chunkSize = config.constants.CHUNK_SIZE;
		if (config.constants.MAX_SIZE !== null) this.maxSize = config.constants.MAX_SIZE;
		this.expirationTime = config.constants.EXPIRATION_TIME;
		this.location = config.location;
		this.storageDriver = config.driver;
		this.extensions = this.storageDriver.tusExtensions;
		this.schema = config.schema;
		this.accountability = config.accountability;
	}

	public override async create(upload: Upload): Promise<Upload> {
		const logger = useLogger();
		const knex = getDatabase();

		const filesItemsService = new ItemsService<File>('directus_files', {
			accountability: this.accountability,
			schema: this.schema,
			knex,
		});

		upload.creation_date = new Date().toISOString();

		if (!upload.size || !upload.metadata || !upload.metadata['filename_download']) {
			throw ERRORS.INVALID_METADATA;
		}

		if (!upload.metadata['type']) {
			upload.metadata['type'] = 'application/octet-stream';
		}

		if (!upload.metadata['title']) {
			upload.metadata['title'] = formatTitle(upload.metadata['filename_download']);
		}

		let existingFile: Record<string, any> | null = null;

		// If the payload contains a primary key, we'll check if the file already exists
		if (upload.metadata['id']) {
			// If the file you're uploading already exists, we'll consider this upload a replace so we'll fetch the existing file's folder and filename_download
			existingFile =
				(await knex
					.select('folder', 'filename_download', 'filename_disk', 'title', 'description', 'metadata', 'tus_id')
					.from('directus_files')
					.andWhere({ id: upload.metadata['id'] })
					.first()) ?? null;

			if (existingFile && existingFile['tus_id'] !== null) {
				throw ERRORS.INVALID_METADATA;
			}
		}

		// Is this file a replacement? if the file data already exists and we have a primary key
		const isReplacement = existingFile !== null && !!upload.metadata['id'];

		if (isReplacement === true && upload.metadata['id']) {
			upload.metadata['replace_id'] = upload.metadata['id'];
		}

		const fileData: Partial<File> = {
			...omit(upload.metadata, ['id', 'replace_id']),
			tus_id: upload.id,
			tus_data: upload,
			filesize: upload.size,
			storage: this.location,
		};

		// If no folder is specified, we'll use the default folder from the settings if it exists
		if ('folder' in fileData === false) {
			const settings = await knex.select('storage_default_folder').from('directus_settings').first();

			if (settings?.storage_default_folder) {
				fileData.folder = settings.storage_default_folder;
			}
		}

		// If this is a new file upload, we need to generate a new primary key and DB record
		const primaryKey = await filesItemsService.createOne(fileData, { emitEvents: false });

		// Set the file id, so it is available to be sent as a header on upload creation / resume
		if (!upload.metadata['id']) {
			upload.metadata['id'] = primaryKey as string;
		}

		const fileExtension =
			extname(upload.metadata['filename_download']) ||
			(upload.metadata['type'] && '.' + extension(upload.metadata['type'])) ||
			'';

		// The filename_disk is the FINAL filename on disk
		fileData.filename_disk ||= primaryKey + (fileExtension || '');

		try {
			// If this is a replacement, we'll write the file to a temp location first to ensure we don't overwrite the existing file if something goes wrong
			upload = (await this.storageDriver.createChunkedUpload(fileData.filename_disk, upload)) as Upload;

			fileData.tus_data = upload;

			await filesItemsService.updateOne(primaryKey!, fileData, { emitEvents: false });

			return upload;
		} catch (err) {
			logger.warn(`Couldn't create chunked upload for ${fileData.filename_disk}`);
			logger.warn(err);

			if (isReplacement) {
				await filesItemsService.updateOne(primaryKey!, { tus_id: null, tus_data: null }, { emitEvents: false });
			} else {
				await filesItemsService.deleteOne(primaryKey!, { emitEvents: false });
			}

			throw ERRORS.UNKNOWN_ERROR;
		}
	}

	public override async write(readable: stream.Readable, tus_id: string, offset: number): Promise<number> {
		const logger = useLogger();
		const fileData = await this.getFileById(tus_id);
		const filePath = fileData.filename_disk!;

		const sudoFilesItemsService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		try {
			const newOffset = await this.storageDriver.writeChunk(
				filePath,
				readable,
				offset,
				fileData.tus_data as ChunkedUploadContext,
			);

			await sudoFilesItemsService.updateOne(fileData.id!, {
				tus_data: {
					...fileData.tus_data,
					offset: newOffset,
				},
			});

			if (Number(fileData.filesize) === newOffset) {
				try {
					await this.storageDriver.finishChunkedUpload(filePath, fileData.tus_data as ChunkedUploadContext);
				} catch (err) {
					await this.remove(fileData.tus_id!);
					throw err;
				}

				const isReplacement = Boolean(fileData.tus_data?.['metadata']?.['replace_id']);

				// If the file is a replacement, delete the old files, and upgrade the temp file
				if (isReplacement === true) {
					const replaceId = fileData.tus_data!['metadata']!['replace_id'] as string;
					const replaceData = await sudoFilesItemsService.readOne(replaceId, { fields: ['filename_disk'] });

					// delete the previously saved file and thumbnails to ensure they're generated fresh
					for await (const partPath of this.storageDriver.list(replaceId)) {
						await this.storageDriver.delete(partPath);
					}

					// Upgrade the temp file to the final filename
					await this.storageDriver.move(filePath, replaceData.filename_disk);
				}
			}

			return newOffset;
		} catch (err: any) {
			logger.error(err, 'Error writing chunk for upload "%s" at offset %d', tus_id, offset);

			if ('status_code' in err && err.status_code === 500) {
				throw err;
			}

			throw ERRORS.FILE_WRITE_ERROR;
		}
	}

	override async remove(tus_id: string): Promise<void> {
		const sudoFilesItemsService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const fileData = await this.getFileById(tus_id);
		await this.storageDriver.deleteChunkedUpload(fileData.filename_disk!, fileData.tus_data as ChunkedUploadContext);
		await sudoFilesItemsService.deleteOne(fileData.id!);
	}

	override async deleteExpired(): Promise<number> {
		const sudoFilesItemsService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const uploadFiles = await sudoFilesItemsService.readByQuery({
			fields: ['modified_on', 'tus_id', 'tus_data'],
			filter: { tus_id: { _nnull: true } },
		});

		if (!uploadFiles) return 0;

		for (const fileData of uploadFiles) {
			if (
				fileData &&
				fileData.tus_data &&
				this.getExpiration() > 0 &&
				fileData.tus_data['size'] !== fileData.tus_data['offset'] &&
				fileData.modified_on
			) {
				const modified = new Date(fileData.modified_on);
				const expires = new Date(modified.getTime() + this.getExpiration());

				if (now > expires) {
					toDelete.push(this.remove(fileData.tus_id!));
				}
			}
		}

		await Promise.allSettled(toDelete);
		return toDelete.length;
	}

	override getExpiration(): number {
		return this.expirationTime;
	}

	override async getUpload(id: string): Promise<Upload> {
		const fileData = await this.getFileById(id);

		return new Upload(fileData.tus_data as any);
	}

	protected async getFileById(tus_id: string) {
		const sudoFilesItemsService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const results = await sudoFilesItemsService.readByQuery({
			filter: {
				tus_id: { _eq: tus_id },
				storage: { _eq: this.location },
				...(this.accountability?.user ? { uploaded_by: { _eq: this.accountability.user } } : {}),
			},
		});

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return results[0] as File;
	}
}
