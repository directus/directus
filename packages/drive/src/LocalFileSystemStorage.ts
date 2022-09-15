import fse from 'fs-extra';
import { dirname, join, resolve, relative, sep } from 'path';
import Storage from './Storage.js';
import { isReadableStream, pipeline } from './utils.js';
import { FileNotFound, UnknownException, PermissionMissing } from './exceptions/index.js';
import type {
	Response,
	ExistsResponse,
	ContentResponse,
	StatResponse,
	FileListResponse,
	DeleteResponse,
	Range,
} from './types.js';
import { appendFile, opendir, readFile, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';

const { copy, createReadStream, ensureDir, move, outputFile, pathExists, stat } = fse;

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
	public override async append(location: string, content: Buffer | string): Promise<Response> {
		try {
			const result = await appendFile(this._fullPath(location), content);
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * Copy a file to a location.
	 */
	public override async copy(src: string, dest: string): Promise<Response> {
		try {
			const result = await copy(this._fullPath(src), this._fullPath(dest));
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, `${src} -> ${dest}`);
		}
	}

	/**
	 * Delete existing file.
	 */
	public override async delete(location: string): Promise<DeleteResponse> {
		try {
			const result = await unlink(this._fullPath(location));
			return { raw: result, wasDeleted: true };
		} catch (e: any) {
			const error = handleError(e, location);

			if (error instanceof FileNotFound) {
				return { raw: undefined, wasDeleted: false };
			}

			throw error;
		}
	}

	/**
	 * Returns the driver.
	 */
	public override driver(): typeof fse {
		return fse;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public override async exists(location: string): Promise<ExistsResponse> {
		try {
			const result = await pathExists(this._fullPath(location));
			return { exists: result, raw: result };
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents as string.
	 */
	public override async get(location: string, encoding: BufferEncoding = 'utf-8'): Promise<ContentResponse<string>> {
		try {
			const result = await readFile(this._fullPath(location), { encoding: encoding });
			return { content: result, raw: result };
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents as Buffer.
	 */
	public override async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		try {
			const result = await readFile(this._fullPath(location));
			return { content: result, raw: result };
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns file size in bytes.
	 */
	public override async getStat(location: string): Promise<StatResponse> {
		try {
			const statInfo = await stat(this._fullPath(location));
			return {
				size: statInfo.size,
				modified: statInfo.mtime,
				raw: statInfo,
			};
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns a read stream for a file location.
	 */
	public override getStream(location: string, range?: Range): NodeJS.ReadableStream {
		return createReadStream(this._fullPath(location), {
			start: range?.start,
			end: range?.end,
		});
	}

	/**
	 * Move file to a new location.
	 */
	public override async move(src: string, dest: string): Promise<Response> {
		try {
			const result = await move(this._fullPath(src), this._fullPath(dest));
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, `${src} -> ${dest}`);
		}
	}

	/**
	 * Prepends content to a file.
	 */
	public override async prepend(location: string, content: Buffer | string): Promise<Response> {
		try {
			const { content: actualContent } = await this.get(location, 'utf-8');

			return this.put(location, `${content}${actualContent}`);
		} catch (e: any) {
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
	public override async put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response> {
		const fullPath = this._fullPath(location);

		try {
			if (isReadableStream(content)) {
				const dir = dirname(fullPath);
				await ensureDir(dir);
				const ws = createWriteStream(fullPath);
				await pipeline(content, ws);
				return { raw: undefined };
			}

			const result = await outputFile(fullPath, content);
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, location);
		}
	}

	/**
	 * List files with a given prefix.
	 */
	public override flatList(prefix = ''): AsyncIterable<FileListResponse> {
		const fullPrefix = this._fullPath(prefix);
		return this._flatDirIterator(fullPrefix, prefix);
	}

	private async *_flatDirIterator(prefix: string, originalPrefix: string): AsyncIterable<FileListResponse> {
		const prefixDirectory = prefix[prefix.length - 1] === sep ? prefix : dirname(prefix);

		try {
			const dir = await opendir(prefixDirectory);

			for await (const file of dir) {
				const fileName = join(prefixDirectory, file.name);
				if (fileName.toLowerCase().startsWith(prefix.toLowerCase())) {
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
		} catch (e: any) {
			if (e.code !== 'ENOENT') {
				throw handleError(e, originalPrefix);
			}
		}
	}
}

export type LocalFileSystemStorageConfig = {
	root: string;
};
