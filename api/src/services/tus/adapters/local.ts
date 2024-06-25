/* eslint-disable no-console */
/**
 * TUS local storage implementation for resumable uploads
 *
 * https://tus.io/
 */
import { type Configstore } from '@tus/file-store';
import { DataStore, ERRORS, Upload } from '@tus/server';
import fs from 'fs';
import fsProm from 'fs/promises';
import path from 'path';
import stream from 'node:stream';
import http from 'node:http';
import { FilesService } from '../../files.js';
import type { AbstractServiceOptions } from '../../../types/services.js';
import type { File } from '@directus/types';
import { toArray } from '@directus/utils';
import { useEnv } from '@directus/env';
import { getConfigFromEnv } from '../../../utils/get-config-from-env.js';
import { extension } from 'mime-types';
import { getSchema } from '../../../utils/get-schema.js';

export type LocalOptions = {
	directory: string;
	configstore?: Configstore;
	expirationPeriodInMilliseconds?: number;
};

const env = useEnv();

const FILE_DOESNT_EXIST = 'ENOENT';

export class LocalFileStore extends DataStore {
	storageDriver = 'local';
	directory: string;
	expirationPeriodInMilliseconds: number;
	service: FilesService | undefined;

	constructor({ expirationPeriodInMilliseconds }: LocalOptions) {
		super();
		this.directory = this.getDirectory();
		this.expirationPeriodInMilliseconds = expirationPeriodInMilliseconds ?? 0;
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

		const fileData: Partial<File> = {
			tus_id: file.id,
			tus_data: file,
			filename_download: file.metadata!['filename']!,
			type: file.metadata!['filetype']!,
			filesize: file.size!,
			storage: storageTarget,
		};

		try {
			const key = await this.service?.createOne(fileData);

			const fileExt = extension(fileData.type!);
			const fileName = `${key}.${fileExt}`;

			// create empty file
			await fsProm.writeFile(path.join(this.directory, fileName), '');

			await this.service?.updateOne(key!, {
				filename_disk: fileName,
			});
		} catch (err) {
			console.warn(err)
		}

		return file;
	}

	override async remove(file_id: string): Promise<void> {
		await this.service?.deleteOne(file_id)
	}

	override async write(readable: http.IncomingMessage | stream.Readable, file_id: string, offset: number): Promise<number> {
			const results = await this.service?.readByQuery({ filter: { tus_id: { _eq: file_id } } });

			if (!results) {
				throw new Error('no file found');
			}

			const fileData = results[0] as File;
			const fileExt = extension(fileData.type!);
			const filePath = path.join(this.directory, `${fileData.id}.${fileExt}`);


		const writeable = fs.createWriteStream(filePath, {
			flags: 'r+',
			start: offset,
		});

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
					console.log('[FileStore] write: Error', err);
					return reject(ERRORS.FILE_WRITE_ERROR);
				}

				console.log(`[FileStore] write: ${bytes_received} bytes written to ${filePath}`);
				offset += bytes_received;
				console.log(`[FileStore] write: File is now ${offset} bytes`);

				return resolve(offset);
			});
		}).then(async (offset) => {
			await this.service?.updateOne(fileData.id, {
				tus_data: {
					...fileData.tus_data,
					offset,
				}
			});

			return offset;
		});
	}

	override async getUpload(id: string): Promise<Upload> {
		const results = await this.service?.readByQuery({
			filter: { tus_id: { _eq: id } },
		}).catch(() => {});

		if (!results) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		const fileData = results[0] as File;
		const fileExt = extension(fileData.type!);

		return new Promise((resolve, reject) => {
			const file_path = path.join(this.directory, `${fileData.id}.${fileExt}`);

			fs.stat(file_path, (error, stats) => {
				if (error && error.code === FILE_DOESNT_EXIST && fileData) {
					console.log(`[FileStore] getUpload: No file found at ${file_path} but db record exists`, fileData);
					return reject(ERRORS.FILE_NO_LONGER_EXISTS);
				}

				if (error && error.code === FILE_DOESNT_EXIST) {
					console.log(`[FileStore] getUpload: No file found at ${file_path}`);
					return reject(ERRORS.FILE_NOT_FOUND);
				}

				if (error) {
					return reject(error);
				}

				if (stats.isDirectory()) {
					console.log(`[FileStore] getUpload: ${file_path} is a directory`);
					return reject(ERRORS.FILE_NOT_FOUND);
				}

				return resolve(
					new Upload(fileData.tus_data as any),
				);
			});
		});
	}

	override async deleteExpired(): Promise<number> {
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const service = new FilesService({
			schema: await getSchema(),
		});

		this.service = service;

		const uploadFiles = await service.readByQuery({
			filter: { tus_id: { _null: false } },
		}) as undefined | File[];

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
		return this.expirationPeriodInMilliseconds;
	}
}
