import formatTitle from '@directus/format-title';
import type { TusDriver, ChunkedUploadContext } from '@directus/storage';
import type { Accountability, File, SchemaOverview } from '@directus/types';
import { extension } from 'mime-types';
import { extname } from 'node:path';
import stream from 'node:stream';
import { DataStore, ERRORS, Upload } from '@tus/utils';
import { ItemsService } from '../items.js';
import { useLogger } from '../../logger.js';
import { omit } from 'lodash-es';

export type TusDataStoreConfig = {
	constants: {
		ENABLED: boolean;
		CHUNK_SIZE: number;
		MAX_SIZE: number;
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
	protected chunkSize: number;
	protected maxSize: number;
	protected expirationTime: number;
	protected location: string;
	protected storageDriver: TusDriver;
	protected schema: SchemaOverview;
	protected accountability: Accountability | undefined;

	constructor(config: TusDataStoreConfig) {
		super();

		this.chunkSize = config.constants.CHUNK_SIZE;
		this.maxSize = config.constants.MAX_SIZE;
		this.expirationTime = config.constants.EXPIRATION_TIME;
		this.location = config.location;
		this.storageDriver = config.driver;
		this.extensions = this.storageDriver.tusExtensions;
		this.schema = config.schema;
		this.accountability = config.accountability;
	}

	public override async create(upload: Upload): Promise<Upload> {
		const logger = useLogger();

		const itemsService = new ItemsService<File>('directus_files', {
			accountability: this.accountability,
			schema: this.schema,
		});

		upload.creation_date = new Date().toISOString();

		if (!upload.metadata || !upload.metadata['filename']) {
			throw new Error('Invalid payload');
		}

		const fileName = upload.metadata['filename'];
		const fileType = upload.metadata['filetype'] ?? 'application/octet-stream';
		const fileInfo = omit(upload.metadata, ['filename', 'filetype']);

		const fileData: Partial<File> = {
			...fileInfo,
			tus_id: upload.id,
			tus_data: upload,
			type: fileType,
			filesize: upload.size!,
			filename_download: fileName,
			title: formatTitle(fileName),
			storage: this.location,
		};

		const primaryKey = await itemsService.createOne(fileData);

		const fileExtension = extname(fileName!) || (fileType && '.' + extension(fileType)) || '';
		const diskFileName = primaryKey + (fileExtension || '');

		try {
			upload = (await this.storageDriver.createChunkedUpload(diskFileName, upload)) as Upload;

			await itemsService.updateOne(primaryKey!, {
				filename_disk: diskFileName,
				tus_data: upload,
			});

			return upload;
		} catch (err) {
			// Clean up the database entry
			await itemsService.deleteOne(primaryKey!);

			logger.warn(err, "Couldn't create chunked upload.");
			throw ERRORS.UNKNOWN_ERROR;
		}
	}

	public override async write(readable: stream.Readable, tus_id: string, offset: number): Promise<number> {
		const fileData = await this.getFileById(tus_id);
		const filePath = fileData.filename_disk!;

		const sudoService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		try {
			const newOffset = await this.storageDriver.writeChunk(
				filePath,
				readable,
				offset,
				fileData.tus_data as ChunkedUploadContext,
			);

			await sudoService.updateOne(fileData.id!, {
				tus_data: {
					...fileData.tus_data,
					offset: newOffset,
				},
			});

			if (fileData.filesize === newOffset) {
				await this.storageDriver.finishChunkedUpload(filePath, fileData.tus_data as ChunkedUploadContext);
			}

			return newOffset;
		} catch (err: any) {
			if ('status_code' in err && err.status_code === 500) {
				throw err;
			}

			throw ERRORS.FILE_WRITE_ERROR;
		}
	}

	override async remove(tus_id: string): Promise<void> {
		const sudoService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const fileData = await this.getFileById(tus_id);
		await this.storageDriver.deleteChunkedUpload(fileData.filename_disk!, fileData.tus_data as ChunkedUploadContext);
		await sudoService.deleteOne(fileData.id!);
	}

	override async deleteExpired(): Promise<number> {
		const sudoService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const uploadFiles = await sudoService.readByQuery({
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
		const itemsService = new ItemsService<File>('directus_files', {
			schema: this.schema,
		});

		const results = await itemsService.readByQuery({
			filter: {
				tus_id: { _eq: tus_id },
				...(this.accountability?.user ? { uploaded_by: { _eq: this.accountability.user } } : {}),
			},
		});

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return results[0] as File;
	}
}
