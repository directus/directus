import filenamify from 'filenamify';
import findCacheDirectory from 'find-cache-dir';
import type { Store } from 'keyv';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function getCache() {
	const dir = findCacheDirectory({ name: 'directus' });
	if (!dir) return;

	try {
		// Try to create directory, if it doesn't already exist
		await fs.mkdir(dir, { recursive: true });
	} catch {
		return;
	}

	return new Cache(dir);
}

class Cache implements Store<string> {
	constructor(private dir: string) {}

	async get(key: string) {
		try {
			const file = path.join(this.dir, filenamify(key));

			return await fs.readFile(file, { encoding: 'utf8' });
		} catch {
			return undefined;
		}
	}

	async set(key: string, value: string) {
		const file = path.join(this.dir, filenamify(key));

		return fs.writeFile(file, value, { encoding: 'utf8' }).catch();
	}

	async delete(key: string) {
		try {
			const file = path.join(this.dir, filenamify(key));

			await fs.unlink(file);

			return true;
		} catch {
			return false;
		}
	}

	async clear() {
		// Not required
	}
}
