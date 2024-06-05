/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { toArray } from '@directus/utils';
import { FileConfigstore, type Configstore } from '@tus/file-store';
import { DataStore, ERRORS, Server, Upload } from '@tus/server';
import { FilesService } from './services/files.js';
import fs from 'fs';
import fsProm from 'fs/promises';
import path from 'path';
import stream from 'node:stream';
import http from 'node:http';
import { useEnv } from '@directus/env';

type Options = {
	directory: string;
	configstore?: Configstore;
	expirationPeriodInMilliseconds?: number;
};
const MASK = '0777';
const IGNORED_MKDIR_ERROR = 'EEXIST';
const FILE_DOESNT_EXIST = 'ENOENT';

class DirectusFileStore extends DataStore {
	directory: string;
	configstore: Configstore;
	expirationPeriodInMilliseconds: number;

	constructor({ directory, configstore, expirationPeriodInMilliseconds }: Options) {
		super();
		this.directory = directory;
		this.configstore = configstore ?? new FileConfigstore(directory);
		this.expirationPeriodInMilliseconds = expirationPeriodInMilliseconds ?? 0;

		this.extensions = ['creation', 'creation-with-upload', 'creation-defer-length', 'termination', 'expiration'];

		// TODO: this async call can not happen in the constructor
		this.checkOrCreateDirectory();
	}

	private checkOrCreateDirectory() {
		fs.mkdir(this.directory, { mode: MASK, recursive: true }, (error) => {
			if (error && error.code !== IGNORED_MKDIR_ERROR) {
				throw error;
			}
		});
	}

	/**
	 * Create an empty file.
	 */
	override async create(file: Upload): Promise<Upload> {
		console.log('create')
		const dirs = file.id.split('/').slice(0, -1);

		await fsProm.mkdir(path.join(this.directory, ...dirs), { recursive: true });
		await fsProm.writeFile(path.join(this.directory, file.id), '');
		await this.configstore.set(file.id, file);

		return file;
	}

	read(file_id: string) {
		console.log('read')
		return fs.createReadStream(path.join(this.directory, file_id));
	}

	override remove(file_id: string): Promise<void> {
		console.log('remove')
		return new Promise((resolve, reject) => {
			fs.unlink(`${this.directory}/${file_id}`, (err) => {
				if (err) {
					console.log('[FileStore] delete: Error', err);
					reject(ERRORS.FILE_NOT_FOUND);
					return;
				}

				try {
					resolve(this.configstore.delete(file_id));
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	override write(readable: http.IncomingMessage | stream.Readable, file_id: string, offset: number): Promise<number> {
		console.log('write')
		const file_path = path.join(this.directory, file_id);

		const writeable = fs.createWriteStream(file_path, {
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

		return new Promise((resolve, reject) => {
			stream.pipeline(readable, transform, writeable, (err) => {
				if (err) {
					console.log('[FileStore] write: Error', err);
					return reject(ERRORS.FILE_WRITE_ERROR);
				}

				console.log(`[FileStore] write: ${bytes_received} bytes written to ${file_path}`);
				offset += bytes_received;
				console.log(`[FileStore] write: File is now ${offset} bytes`);

				return resolve(offset);
			});
		});
	}

	override async getUpload(id: string): Promise<Upload> {
		console.log('getUpload')
		const file = await this.configstore.get(id);

		if (!file) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return new Promise((resolve, reject) => {
			const file_path = `${this.directory}/${id}`;

			fs.stat(file_path, (error, stats) => {
				if (error && error.code === FILE_DOESNT_EXIST && file) {
					console.log(`[FileStore] getUpload: No file found at ${file_path} but db record exists`, file);
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
					new Upload({
						id,
						size: file.size!,
						offset: stats.size,
						metadata: file.metadata!,
						creation_date: file.creation_date!,
					}),
				);
			});
		});
	}

	override async declareUploadLength(id: string, upload_length: number) {
		console.log('declareUploadLength')
		const file = await this.configstore.get(id);

		if (!file) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		file.size = upload_length;

		await this.configstore.set(id, file);
	}

	override async deleteExpired(): Promise<number> {
		console.log('deleteExpired')
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		if (!this.configstore.list) {
			throw ERRORS.UNSUPPORTED_EXPIRATION_EXTENSION;
		}

		const uploadKeys = await this.configstore.list();

		for (const file_id of uploadKeys) {
			try {
				const info = await this.configstore.get(file_id);

				if (
					info &&
					'creation_date' in info &&
					this.getExpiration() > 0 &&
					info.size !== info.offset &&
					info.creation_date
				) {
					const creation = new Date(info.creation_date);
					const expires = new Date(creation.getTime() + this.getExpiration());

					if (now > expires) {
						toDelete.push(this.remove(file_id));
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
		console.log('getExpiration')
		return this.expirationPeriodInMilliseconds;
	}
}

const env = useEnv();

const store = new DirectusFileStore({
	directory: path.join(env['EXTENSIONS_PATH'] as string, '.temp'),
	expirationPeriodInMilliseconds: 60_000
});

export const tusServer = new Server({
	path: '/files/tus',
	datastore: store,
	onUploadCreate: async (_req, res, upload) => {
		console.log('create', /*req, res,*/ upload);
		return res;
	},
	onUploadFinish: async (req: any, res, upload) => {
		console.log('finished', /*req, res,*/ upload);

		try {
			const service = new FilesService({
				// accountability: req.accountability,
				schema: req.schema,
			});

			const disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;

			console.log(
				'stored?',
				await service.uploadOne(store.read(upload.id), {
					storage: disk,
					type: upload.metadata?.['filetype'] ?? 'unknown',
					title: upload.metadata?.['filename'] ?? null,
					filename_download: upload.metadata?.['filename'] ?? 'test',
				}),
			);

			await store.remove(upload.id);
		} catch (err) {
			console.warn('why', err);
		}

		return res;
	},
});

// tusServer.cleanUpExpiredUploads();
