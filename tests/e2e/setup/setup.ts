import 'vitest';
import fs from 'fs/promises';
import { expect } from 'vitest';
import { createHash } from 'crypto';

async function exists(file: string) {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}

expect.extend({
	toMatchFile: async (received, expected: string) => {
		if (!(await exists(expected))) {
			await fs.writeFile(expected, received);
		}

		const expectFile = await fs.readFile(expected);
		const expectHash = createHash('sha256').update(expectFile).digest('hex');
		const receivedHash = createHash('sha256').update(received).digest('hex');

		return {
			message: () => `Expected file to match ${expected}`,
			pass: expectHash === receivedHash,
		};
	},
});
