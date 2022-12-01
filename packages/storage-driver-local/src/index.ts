import type { Driver, Range } from '@directus/storage';
import { createReadStream } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import type { ReadStreamOptions } from 'node:fs';

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
		const options: ReadStreamOptions = {};

		if (range?.start) {
			options.start = range.start;
		}

		if (range?.end) {
			options.end = range.end;
		}

		return createReadStream(this.getFullPath(filepath), options);
	}
}

export default DriverLocal;
