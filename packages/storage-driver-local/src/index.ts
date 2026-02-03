import fsProm from 'fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, copyFile, mkdir, opendir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import stream, { type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { TusDriver } from '@directus/storage';
import type { ChunkedUploadContext, ReadOptions } from '@directus/types';

export type DriverLocalConfig = {
	root: string;
};

export class DriverLocal implements TusDriver {
	private readonly root: string;

	constructor(config: DriverLocalConfig) {
		this.root = resolve(config.root);
	}

	private fullPath(filepath: string) {
		return join(this.root, join(sep, filepath));
	}

	/**
	 * Ensures that the directory exists. If it doesn't, it's created.
	 */
	private async ensureDir(dirpath: string) {
		await mkdir(dirpath, { recursive: true });
	}

	async read(filepath: string, options?: ReadOptions) {
		const { range } = options || {};

		const stream_options: Parameters<typeof createReadStream>[1] = {};

		if (range?.start) {
			stream_options.start = range.start;
		}

		if (range?.end) {
			stream_options.end = range.end;
		}

		return createReadStream(this.fullPath(filepath), stream_options);
	}

	async stat(filepath: string) {
		const statRes = await stat(this.fullPath(filepath));

		if (!statRes) {
			throw new Error(`File "${filepath}" doesn't exist.`);
		}

		return {
			size: statRes.size,
			modified: statRes.mtime,
		};
	}

	async exists(filepath: string) {
		return access(this.fullPath(filepath))
			.then(() => true)
			.catch(() => false);
	}

	async move(src: string, dest: string) {
		const fullSrc = this.fullPath(src);
		const fullDest = this.fullPath(dest);
		await this.ensureDir(dirname(fullDest));
		await rename(fullSrc, fullDest);
	}

	async copy(src: string, dest: string) {
		const fullSrc = this.fullPath(src);
		const fullDest = this.fullPath(dest);
		await this.ensureDir(dirname(fullDest));
		await copyFile(fullSrc, fullDest);
	}

	async write(filepath: string, content: Readable) {
		const fullPath = this.fullPath(filepath);
		await this.ensureDir(dirname(fullPath));
		const writeStream = createWriteStream(fullPath);
		await pipeline(content, writeStream);
	}

	async delete(filepath: string) {
		const fullPath = this.fullPath(filepath);
		await unlink(fullPath);
	}

	list(prefix = '') {
		const fullPrefix = this.fullPath(prefix);
		return this.listGenerator(fullPrefix);
	}

	private async *listGenerator(prefix: string): AsyncGenerator<string> {
		const prefixDirectory = prefix.endsWith(sep) ? prefix : dirname(prefix);

		const directory = await opendir(prefixDirectory);

		for await (const file of directory) {
			const fileName = join(prefixDirectory, file.name);

			if (fileName.toLowerCase().startsWith(prefix.toLowerCase()) === false) continue;

			if (file.isFile()) {
				yield relative(this.root, fileName);
			}

			if (file.isDirectory()) {
				yield* this.listGenerator(join(fileName, sep));
			}
		}
	}

	get tusExtensions() {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<ChunkedUploadContext> {
		const fullPath = this.fullPath(filepath);
		await this.ensureDir(dirname(fullPath));

		await fsProm.writeFile(fullPath, '');

		return context;
	}

	async deleteChunkedUpload(filepath: string, _context: ChunkedUploadContext): Promise<void> {
		await this.delete(filepath);
	}

	async finishChunkedUpload(_filepath: string, _context: ChunkedUploadContext): Promise<void> {}

	async writeChunk(
		filepath: string,
		content: Readable,
		offset: number,
		_context: ChunkedUploadContext,
	): Promise<number> {
		const fullPath = this.fullPath(filepath);

		const writeable = await fsProm.open(fullPath, 'r+').then((file) =>
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
			stream.pipeline(content, transform, writeable, (err) => {
				if (err) {
					return reject();
				}

				offset += bytes_received;

				return resolve(offset);
			});
		}).then(async (offset) => {
			return offset;
		});
	}
}

export default DriverLocal;
