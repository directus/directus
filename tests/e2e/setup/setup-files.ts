import { writeFile, readFile, access } from 'fs/promises';
import { expect } from 'vitest';
import { createHash } from 'crypto';
import { join } from 'path';

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
