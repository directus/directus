import type { Driver, Range } from '@directus/storage';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { writeFile, readFile, stat, rename, copyFile, access, mkdir } from 'node:fs/promises';
import { join, resolve, sep, dirname } from 'node:path';

export type DriverLocalConfig = {
	root: string;
};

export class DriverLocal implements Driver {
	private root: string;

	constructor(config: DriverLocalConfig) {
		this.root = resolve(config.root);
	}

	private getFullPath(filepath: string) {
		return join(this.root, join(sep, filepath));
	}

	/**
	 * Ensures that the directory exists. If it doesn't, it's created.
	 */
	private async ensureDir(dirpath: string) {
		await mkdir(dirpath, { recursive: true });
	}

	async getStream(filepath: string, range?: Range) {
		const options: Parameters<typeof createReadStream>[1] = {};

		if (range?.start) {
			options.start = range.start;
		}

		if (range?.end) {
			options.end = range.end;
		}

		return createReadStream(this.getFullPath(filepath), options);
	}

	async getBuffer(filepath: string) {
		return await readFile(this.getFullPath(filepath));
	}

	async getStat(filepath: string) {
		const statRes = await stat(this.getFullPath(filepath));

		if (!statRes) {
			throw new Error(`File "${filepath}" doesn't exist.`);
		}

		return {
			size: statRes.size,
			modified: statRes.mtime,
		};
	}

	async exists(filepath: string) {
		return access(this.getFullPath(filepath))
			.then(() => true)
			.catch(() => false);
	}

	async move(src: string, dest: string) {
		const fullSrc = this.getFullPath(src);
		const fullDest = this.getFullPath(dest);
		await this.ensureDir(dirname(fullDest));
		await rename(fullSrc, fullDest);
	}

	async copy(src: string, dest: string) {
		const fullSrc = this.getFullPath(src);
		const fullDest = this.getFullPath(dest);
		await this.ensureDir(dirname(fullDest));
		await copyFile(fullSrc, fullDest);
	}

	async put(filepath: string, content: string | Buffer | NodeJS.ReadableStream) {
		const fullPath = this.getFullPath(filepath);
		await this.ensureDir(dirname(fullPath));

		if (content instanceof Readable) {
			const writeStream = createWriteStream(fullPath);
			await pipeline(content, writeStream);
		} else {
			await writeFile(fullPath, content);
		}
	}
}

export default DriverLocal;
