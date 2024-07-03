import { createBLAKE3 } from 'hash-wasm';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { hexToUint8Array } from 'uint8array-extras';

/**
 * Get the BLAKE3 hash sum of a file
 */
export async function getHash(stream: Readable, state?: string) {
	const blake3 = await createBLAKE3();

	if (state) blake3.load(hexToUint8Array(state));

	await pipeline(stream, async (source) => {
		for await (const chunk of source) {
			blake3.update(chunk);
		}
	});

	return blake3.digest();
}
