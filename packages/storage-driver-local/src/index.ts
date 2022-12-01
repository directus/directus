import type { Driver, Range } from '@directus/storage';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

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
		const statRes = await stat(this.getFullPath(filepath));
		return !!statRes;
	}
}

export default DriverLocal;
