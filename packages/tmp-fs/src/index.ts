import * as fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export async function createDirectory({ prefix = 'tmp-' } = {}) {
	const path = await fsp.mkdtemp(join(tmpdir(), prefix));

	async function cleanup() {
		return await fsp.rmdir(path);
	}

	return {
		path,
		cleanup,
	};
}

export async function createFile({ prefix = 'tmp-' } = {}) {
	const dir = await createDirectory({ prefix });
	const filename = createHash('sha1').update(new Date().toString()).digest('hex').substring(0, 8);
	const path = join(dir.path, filename);

	const fd = await fsp.open(path, 'w');
	await fd.close();

	async function cleanup() {
		await fsp.unlink(path);
		await dir.cleanup();
	}

	return {
		path,
		cleanup,
	};
}
