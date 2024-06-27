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
import { ERRORS, Upload } from '@tus/utils';
import { TusDataStore, type TusDataStoreConfig } from '@directus/tus-driver';
import type { File } from '@directus/types';
import formatTitle from '@directus/format-title';

const FILE_DOESNT_EXIST = 'ENOENT';

export class LocalFileStore extends TusDataStore {
	directory: string;

	constructor(config: TusDataStoreConfig) {
		super(config);

		this.directory = config.options['root'] as string;
		this.extensions = ['creation', 'termination', 'expiration'];
	}

	override async create(file: Upload): Promise<Upload> {
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
			storage: 'local',
		};

		const key = await this.getService().createOne(fileData);

		const fileExt = extension(fileData.type!);
		const diskFileName = `${key}.${fileExt}`;

		await fsProm.writeFile(path.join(this.directory, diskFileName), '');

		await this.getService().updateOne(key!, {
			filename_disk: diskFileName,
		});

		return file;
	}

	override async remove(tus_id: string): Promise<void> {
		const file = await this.getFileById(tus_id);

		await this.getService().deleteOne(file.id);
	}

	override async write(readable: IncomingMessage | stream.Readable, file_id: string, offset: number): Promise<number> {
		const results = await this.getService().readByQuery({ filter: { tus_id: { _eq: file_id } } });

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
			stream.pipeline(readable, transform, writeable, (err) => {
				if (err) {
					this.logger.error('[FileStore] write: Error', err);
					return reject(ERRORS.FILE_WRITE_ERROR);
				}

				this.logger.trace(`[FileStore] write: ${bytes_received} bytes written to ${filePath}`);
				offset += bytes_received;
				this.logger.trace(`[FileStore] write: File is now ${offset} bytes`);

				return resolve(offset);
			});
		}).then(async (offset) => {
			await this.getService().updateOne(fileData.id, {
				tus_data: {
					...fileData.tus_data,
					offset,
				},
			});

			return offset;
		});
	}

	override async getUpload(id: string): Promise<Upload> {
		const fileData = await this.getFileById(id);
		const fileExt = extension(fileData.type!);
		const filePath = path.join(this.directory, `${fileData.id}.${fileExt}`);

		return fsProm
			.stat(filePath)
			.then((stats) => {
				if (stats.isDirectory()) {
					this.logger.error(`[FileStore] getUpload: ${filePath} is a directory`);
					throw ERRORS.FILE_NOT_FOUND;
				}

				return new Upload(fileData.tus_data as any);
			})
			.catch((error) => {
				if (error && error.code === FILE_DOESNT_EXIST && fileData) {
					this.logger.error(`[FileStore] getUpload: No file found at ${filePath} but db record exists`, fileData);
					throw ERRORS.FILE_NO_LONGER_EXISTS;
				}

				if (error && error.code === FILE_DOESNT_EXIST) {
					this.logger.error(`[FileStore] getUpload: No file found at ${filePath}`);
					throw ERRORS.FILE_NOT_FOUND;
				}

				throw error;
			});
	}
}

export default LocalFileStore;
