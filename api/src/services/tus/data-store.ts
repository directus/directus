import formatTitle from '@directus/format-title';
import type { TusDriver, ChunkedUploadContext } from '@directus/storage';
import type { File } from '@directus/types';
import { extension } from 'mime-types';
import { extname } from 'node:path';
import stream from 'node:stream';
import { DataStore, ERRORS, Upload } from '@tus/utils';
import type { ItemsService } from '../items.js';
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
};

export class TusDataStore extends DataStore {
	protected chunkSize: number;
	protected maxSize: number;
	protected expirationTime: number;
	protected location: string;
	protected _service: ItemsService<File> | undefined;
	protected _sudoService: ItemsService<File> | undefined;
	protected storageDriver: TusDriver;

	constructor(config: TusDataStoreConfig) {
		super();

		this.chunkSize = config.constants.CHUNK_SIZE;
		this.maxSize = config.constants.MAX_SIZE;
		this.expirationTime = config.constants.EXPIRATION_TIME;
		this.location = config.location;
		this.storageDriver = config.driver;
		this.extensions = this.storageDriver.tusExtensions;
	}

	get itemsService(): ItemsService<File> {
		if (!this._service) throw new Error('no service set');
		return this._service;
	}

	set itemsService(service: ItemsService<File>) {
		this._service = service;
	}

	get sudoItemsService(): ItemsService<File> {
		if (!this._sudoService) throw new Error('no sudo service set');
		return this._sudoService;
	}

	set sudoItemsService(service: ItemsService<File>) {
		this._sudoService = service;
	}

	public override async create(upload: Upload): Promise<Upload> {
		const logger = useLogger();
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

		const primaryKey = await this.itemsService.createOne(fileData);

		const fileExtension = extname(fileName!) || (fileType && '.' + extension(fileType)) || '';
		const diskFileName = primaryKey + (fileExtension || '');

		try {
			upload = (await this.storageDriver.createChunkedUpload(diskFileName, upload)) as Upload;

			await this.itemsService.updateOne(primaryKey!, {
				filename_disk: diskFileName,
				tus_data: upload,
			});

			return upload;
		} catch (err) {
			// Clean up the database entry
			await this.itemsService.deleteOne(primaryKey!);

			logger.warn(err, "Couldn't create chunked upload.");
			throw ERRORS.UNKNOWN_ERROR;
		}
	}

	public override async write(readable: stream.Readable, tus_id: string, offset: number): Promise<number> {
		const fileData = await this.getFileById(tus_id);
		const filePath = fileData.filename_disk!;

		try {
			const newOffset = await this.storageDriver.writeChunk(
				filePath,
				readable,
				offset,
				fileData.tus_data as ChunkedUploadContext,
			);

			await this.sudoItemsService.updateOne(fileData.id!, {
				tus_data: {
					...fileData.tus_data,
					offset: newOffset,
				},
			});

			if (fileData.filesize === newOffset) {
				await this.storageDriver.finishChunkedUpload(filePath, fileData.tus_data as ChunkedUploadContext);
			}

			return newOffset;
		} catch (err) {
			throw ERRORS.FILE_WRITE_ERROR;
		}
	}

	override async remove(tus_id: string): Promise<void> {
		const fileData = await this.getFileById(tus_id);
		await this.storageDriver.deleteChunkedUpload(fileData.filename_disk!, fileData.tus_data as ChunkedUploadContext);
		await this.sudoItemsService.deleteOne(fileData.id!);
	}

	override async deleteExpired(): Promise<number> {
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const uploadFiles = await this.sudoItemsService.readByQuery({
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
		const results = await this.itemsService.readByQuery({
			filter: {
				tus_id: { _eq: tus_id },
				...(this.itemsService.accountability?.user
					? { uploaded_by: { _eq: this.itemsService.accountability.user } }
					: {}),
			},
		});

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return results[0] as File;
	}
}
