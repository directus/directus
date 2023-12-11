import { buildStorage } from 'axios-cache-interceptor';
import findCacheDirectory from 'find-cache-dir';
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

	return buildStorage({
		async set(key, value) {
			const file = path.join(dir, key);
			const content = JSON.stringify(value);

			return fs.writeFile(file, content).catch(() => {});
		},

		async remove(key) {
			const file = path.join(dir, key);

			return fs.unlink(file).catch(() => {});
		},

		async find(key) {
			try {
				const file = path.join(dir, key);
				const content = await fs.readFile(file, { encoding: 'utf8' });
				const value = JSON.parse(content);

				return value;
			} catch {
				return undefined;
			}
		},
	});
}
