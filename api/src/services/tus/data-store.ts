import formatTitle from '@directus/format-title';
import type { TusDriver, ChunkedUploadContext } from '@directus/storage';
import type { File } from '@directus/types';
import { extension } from 'mime-types';
import { extname } from 'node:path';
import stream from 'node:stream';
import { DataStore, ERRORS, Upload } from '@tus/utils';
import type { ItemsService } from '../items.js';

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
	protected _service: ItemsService | undefined;
	protected _sudoService: ItemsService | undefined;
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

	get itemsService(): ItemsService {
		if (!this._service) throw new Error('no service set');
		return this._service;
	}

	set itemsService(service: ItemsService) {
		this._service = service;
	}

	get sudoItemService(): ItemsService {
		if (!this._sudoService) throw new Error('no sudo service set');
		return this._sudoService;
	}

	set sudoItemService(service: ItemsService) {
		this._sudoService = service;
	}

	public override async create(upload: Upload): Promise<Upload> {
		upload.creation_date = new Date().toISOString();

		if (!upload.metadata || !upload.metadata['filename']) {
			throw new Error('Invalid payload');
		}

		const fileName = upload.metadata['filename'];
		const fileType = upload.metadata['filetype'] ?? 'application/octet-stream';

		const fileInfo = Object.fromEntries(
			Object.entries(upload.metadata).filter(([key]) => !['filename', 'filetype'].includes(key)),
		);

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

		upload = (await this.storageDriver.createChunkedUpload(diskFileName, upload)) as Upload;

		await this.itemsService.updateOne(primaryKey!, {
			filename_disk: diskFileName,
			tus_data: upload,
		});

		return upload;
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

			await this.sudoItemService.updateOne(fileData.id!, {
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
		await this.sudoItemService.deleteOne(fileData.id!);
	}

	override async deleteExpired(): Promise<number> {
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const uploadFiles = (await this.itemsService.readByQuery({
			filter: { tus_id: { _null: false } },
		})) as undefined | File[];

		if (!uploadFiles) return 0;

		for (const fileData of uploadFiles) {
			try {
				if (
					fileData &&
					fileData.tus_data &&
					'creation_date' in fileData.tus_data &&
					this.getExpiration() > 0 &&
					fileData.tus_data['size'] !== fileData.tus_data['offset'] &&
					fileData.tus_data['creation_date']
				) {
					const creation = new Date(fileData.tus_data['creation_date']);
					const expires = new Date(creation.getTime() + this.getExpiration());

					if (now > expires) {
						toDelete.push(this.remove(fileData.tus_id!));
					}
				}
			} catch (error) {
				if (error !== ERRORS.FILE_NO_LONGER_EXISTS) {
					throw error;
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
		}); /*
		.catch((e) => { console.error(e)})*/

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return results[0] as File;
	}
}
