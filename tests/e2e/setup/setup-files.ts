import { createHash } from 'crypto';
import { access, readFile, writeFile } from 'fs/promises';
import util from 'node:util';
import { join } from 'path';
import { expect, inject } from 'vitest';

util.inspect.defaultOptions.depth = null;

// Let sandboxes started in this worker pick up the database snapshot from global-setup-snapshot.ts
Object.assign(process.env, inject('snapshotEnv') ?? {});

async function exists(file: string) {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}

expect.extend({
	toMatchFile: async (received, expected: string) => {
		if (!(await exists(expected))) {
			await writeFile(expected, received);
		}

		const expectFile = await readFile(expected);
		const expectHash = createHash('sha256').update(expectFile).digest('hex');
		const receivedHash = createHash('sha256').update(received).digest('hex');

		return {
			message: () => `Expected file to match ${expected.replace(join(import.meta.dirname, '..'), '')}`,
			pass: expectHash === receivedHash,
		};
	},
});
