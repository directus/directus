import * as fse from 'fs-extra';
import { promises as fs } from 'fs';
import { dirname, join, resolve, relative, sep } from 'path';
import Storage from './Storage';
import { isReadableStream, pipeline } from './utils';
import { FileNotFound, UnknownException, PermissionMissing } from './exceptions';
import {
	Response,
	ExistsResponse,
	ContentResponse,
	StatResponse,
	FileListResponse,
	DeleteResponse,
	Range,
} from './types';

function handleError(err: Error & { code: string; path?: string }, location: string): Error {
	switch (err.code) {
		case 'ENOENT':
			return new FileNotFound(err, location);
		case 'EPERM':
			return new PermissionMissing(err, location);
		default:
			return new UnknownException(err, err.code, location);
	}
}

export class LocalFileSystemStorage extends Storage {
	private $root: string;

	constructor(config: LocalFileSystemStorageConfig) {
		super();
		this.$root = resolve(config.root);
	}

	/**
	 * Returns full path relative to the storage's root directory.
	 */
	private _fullPath(relativePath: string): string {
		return join(this.$root, join(sep, relativePath));
	}

	/**
	 * Appends content to a file.
	 */
	public async append(location: string, content: Buffer | string): Promise<Response> {
		try {
			const result = await fse.appendFile(this._fullPath(location), content);
			return { raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Copy a file to a location.
	 */
	public async copy(src: string, dest: string): Promise<Response> {
		try {
			const result = await fse.copy(this._fullPath(src), this._fullPath(dest));
			return { raw: result };
		} catch (e) {
			throw handleError(e, `${src} -> ${dest}`);
		}
	}

	/**
	 * Delete existing file.
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		try {
			const result = await fse.unlink(this._fullPath(location));
			return { raw: result, wasDeleted: true };
		} catch (e) {
			e = handleError(e, location);

			if (e instanceof FileNotFound) {
				return { raw: undefined, wasDeleted: false };
			}

			throw e;
		}
	}

	/**
	 * Returns the driver.
	 */
	public driver(): typeof fse {
		return fse;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		try {
			const result = await fse.pathExists(this._fullPath(location));
			return { exists: result, raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents as string.
	 */
	public async get(location: string, encoding = 'utf-8'): Promise<ContentResponse<string>> {
		try {
			const result = await fse.readFile(this._fullPath(location), encoding);
			return { content: result, raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents as Buffer.
	 */
	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		try {
			const result = await fse.readFile(this._fullPath(location));
			return { content: result, raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns file size in bytes.
	 */
	public async getStat(location: string): Promise<StatResponse> {
		try {
			const stat = await fse.stat(this._fullPath(location));
			return {
				size: stat.size,
				modified: stat.mtime,
				raw: stat,
			};
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns a read stream for a file location.
	 */
	public getStream(location: string, range?: Range): NodeJS.ReadableStream {
		return fse.createReadStream(this._fullPath(location), {
			start: range?.start,
			end: range?.end,
		});
	}

	/**
	 * Move file to a new location.
	 */
	public async move(src: string, dest: string): Promise<Response> {
		try {
			const result = await fse.move(this._fullPath(src), this._fullPath(dest));
			return { raw: result };
		} catch (e) {
			throw handleError(e, `${src} -> ${dest}`);
		}
	}

	/**
	 * Prepends content to a file.
	 */
	public async prepend(location: string, content: Buffer | string): Promise<Response> {
		try {
			const { content: actualContent } = await this.get(location, 'utf-8');

			return this.put(location, `${content}${actualContent}`);
		} catch (e) {
			if (e instanceof FileNotFound) {
				return this.put(location, content);
			}
			throw e;
		}
	}

	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 */
	public async put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response> {
		const fullPath = this._fullPath(location);

		try {
			if (isReadableStream(content)) {
				const dir = dirname(fullPath);
				await fse.ensureDir(dir);
				const ws = fse.createWriteStream(fullPath);
				await pipeline(content, ws);
				return { raw: undefined };
			}

			const result = await fse.outputFile(fullPath, content);
			return { raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * List files with a given prefix.
	 */
	public flatList(prefix = ''): AsyncIterable<FileListResponse> {
		const fullPrefix = this._fullPath(prefix);
		return this._flatDirIterator(fullPrefix, prefix);
	}

	private async *_flatDirIterator(prefix: string, originalPrefix: string): AsyncIterable<FileListResponse> {
		const prefixDirectory = prefix[prefix.length - 1] === sep ? prefix : dirname(prefix);

		try {
			const dir = await fs.opendir(prefixDirectory);

			for await (const file of dir) {
				const fileName = join(prefixDirectory, file.name);
				if (fileName.startsWith(prefix)) {
					if (file.isDirectory()) {
						yield* this._flatDirIterator(join(fileName, sep), originalPrefix);
					} else if (file.isFile()) {
						const path = relative(this.$root, fileName);
						yield {
							raw: null,
							path,
						};
					}
				}
			}
		} catch (e) {
			if (e.code !== 'ENOENT') {
				throw handleError(e, originalPrefix);
			}
		}
	}
}

export type LocalFileSystemStorageConfig = {
	root: string;
};
