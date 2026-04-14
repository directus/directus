import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function createTmpDirectory() {
	const path = await fs.mkdtemp(join(tmpdir(), 'directus-'));

	async function cleanup() {
		return await fs.rmdir(path);
	}

	return {
		path,
		cleanup,
	};
}

export async function createTmpFile(): Promise<{
	path: string;
	cleanup: () => Promise<void>;
}> {
	const dir = await createTmpDirectory();
	const filename = createHash('sha1').update(new Date().toString()).digest('hex').substring(0, 8);
	const path = join(dir.path, filename);

	try {
		const fd = await fs.open(path, 'wx');
		await fd.close();
	} catch (err) {
		await dir.cleanup();
		throw err;
	}

	async function cleanup() {
		await fs.unlink(path);
		await dir.cleanup();
	}

	return {
		path,
		cleanup,
	};
}
