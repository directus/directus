import type { Driver, Range } from '@directus/storage';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, copyFile, mkdir, opendir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export type DriverLocalConfig = {
	root: string;
};

export class DriverLocal implements Driver {
	private root: string;

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

	async read(filepath: string, range?: Range) {
		const options: Parameters<typeof createReadStream>[1] = {};

		if (range?.start) {
			options.start = range.start;
		}

		if (range?.end) {
			options.end = range.end;
		}

		return createReadStream(this.fullPath(filepath), options);
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
}

export default DriverLocal;
