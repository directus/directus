import { createBLAKE3 } from 'hash-wasm';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * Get the BLAKE3 hash sum of a file
 */
export async function getHash(stream: Readable) {
	return pipeline(stream, async (source) => {
		const blake3 = await createBLAKE3();

		for await (const chunk of source) {
			blake3.update(chunk);
		}

		return blake3.digest();
	});
}
