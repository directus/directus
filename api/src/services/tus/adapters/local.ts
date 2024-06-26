/**
 * TUS local storage implementation for resumable uploads
 *
 * https://tus.io/
 */
import path from 'node:path';
import stream from 'node:stream';
import { IncomingMessage } from 'node:http';
import { extension } from 'mime-types';
import fsProm from 'fs/promises';
import { type Configstore } from '@tus/file-store';
import { DataStore, ERRORS, Upload } from '@tus/server';
import type { File } from '@directus/types';
import { toArray } from '@directus/utils';
import { useEnv } from '@directus/env';
import { FilesService } from '../../files.js';
import type { AbstractServiceOptions } from '../../../types/services.js';
import { getConfigFromEnv } from '../../../utils/get-config-from-env.js';
import { getSchema } from '../../../utils/get-schema.js';
import formatTitle from '@directus/format-title';
import { useLogger } from '../../../logger.js';
import { RESUMABLE_UPLOADS } from '../../../constants.js';

export type LocalOptions = {
	directory: string;
	configstore?: Configstore;
	expirationPeriodInMilliseconds?: number;
};

const env = useEnv();
const logger = useLogger();

const FILE_DOESNT_EXIST = 'ENOENT';

export class LocalFileStore extends DataStore {
	storageDriver = 'local';
	directory: string;
	service: FilesService | undefined;

	constructor() {
		super();
		this.directory = this.getDirectory();
		this.extensions = ['creation', 'termination', 'expiration'];
	}

	init(options: AbstractServiceOptions) {
		this.service = new FilesService(options);
	}

	private getDirectory() {
		const locations = toArray(env['STORAGE_LOCATIONS'] as string);

		for (let location of locations) {
			location = location.trim();
			const driverConfig = getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`);
			const { driver, ...options } = driverConfig;

			if (driver === this.storageDriver) {
				return options['root'];
			}
		}

		throw new Error('Location "local" not configured');
	}

	override async create(file: Upload): Promise<Upload> {
		const storageTarget: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;

		file.metadata = file.metadata ?? {};
		const fileName = file.metadata['filename']!;
		const fileType = file.metadata['filetype'] ?? 'application/octet-stream';

		const fileData: Partial<File> = {
			tus_id: file.id,
			tus_data: file,
			type: fileType,
			filesize: file.size!,
			filename_download: fileName,
			title: formatTitle(fileName),
			storage: storageTarget,
		};

		const key = await this.service?.createOne(fileData);

		const fileExt = extension(fileData.type!);
		const diskFileName = `${key}.${fileExt}`;

		await fsProm.writeFile(path.join(this.directory, diskFileName), '');

		await this.service?.updateOne(key!, {
			filename_disk: diskFileName,
		});

		return file;
	}

	override async remove(file_id: string): Promise<void> {
		await this.service?.deleteOne(file_id);
	}

	override async write(readable: IncomingMessage | stream.Readable, file_id: string, offset: number): Promise<number> {
		const results = await this.service?.readByQuery({ filter: { tus_id: { _eq: file_id } } });

		if (!results) {
			throw new Error('no file found');
		}

		const fileData = results[0] as File;
		const fileExt = extension(fileData.type!);
		const filePath = path.join(this.directory, `${fileData.id}.${fileExt}`);

		const writeable = await fsProm.open(filePath, 'r+').then((file) =>
			file.createWriteStream({
				start: offset,
			}),
		);

		let bytes_received = 0;

		const transform = new stream.Transform({
			transform(chunk, _, callback) {
				bytes_received += chunk.length;
				callback(null, chunk);
			},
		});

		return new Promise<number>((resolve, reject) => {
			// await disk.write(payload.filename_disk, stream, payload.type);
			stream.pipeline(readable, transform, writeable, (err) => {
				if (err) {
					logger.error('[FileStore] write: Error', err);
					return reject(ERRORS.FILE_WRITE_ERROR);
				}

				logger.trace(`[FileStore] write: ${bytes_received} bytes written to ${filePath}`);
				offset += bytes_received;
				logger.trace(`[FileStore] write: File is now ${offset} bytes`);

				return resolve(offset);
			});
		}).then(async (offset) => {
			await this.service?.updateOne(fileData.id, {
				tus_data: {
					...fileData.tus_data,
					offset,
				},
			});

			return offset;
		});
	}

	override async getUpload(id: string): Promise<Upload> {
		const results = await this.service
			?.readByQuery({
				filter: { tus_id: { _eq: id } },
			})
			.catch(() => {});

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		const fileData = results[0] as File;
		const fileExt = extension(fileData.type!);
		const filePath = path.join(this.directory, `${fileData.id}.${fileExt}`);

		return fsProm
			.stat(filePath)
			.then((stats) => {
				if (stats.isDirectory()) {
					logger.error(`[FileStore] getUpload: ${filePath} is a directory`);
					throw ERRORS.FILE_NOT_FOUND;
				}

				return new Upload(fileData.tus_data as any);
			})
			.catch((error) => {
				if (error && error.code === FILE_DOESNT_EXIST && fileData) {
					logger.error(`[FileStore] getUpload: No file found at ${filePath} but db record exists`, fileData);
					throw ERRORS.FILE_NO_LONGER_EXISTS;
				}

				if (error && error.code === FILE_DOESNT_EXIST) {
					logger.error(`[FileStore] getUpload: No file found at ${filePath}`);
					throw ERRORS.FILE_NOT_FOUND;
				}

				throw error;
			});
	}

	override async deleteExpired(): Promise<number> {
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const service = new FilesService({
			schema: await getSchema(),
		});

		this.service = service;

		const uploadFiles = (await service.readByQuery({
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
						toDelete.push(this.remove(fileData.id));
					}
				}
			} catch (error) {
				if (error !== ERRORS.FILE_NO_LONGER_EXISTS) {
					throw error;
				}
			}
		}

		await Promise.all(toDelete);
		return toDelete.length;
	}

	override getExpiration(): number {
		return RESUMABLE_UPLOADS.EXPIRATION_TIME;
	}
}
