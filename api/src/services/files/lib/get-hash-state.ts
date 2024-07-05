import { createBLAKE3 } from 'hash-wasm';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { hexToUint8Array, uint8ArrayToHex } from 'uint8array-extras';

/**
 * Get the (continuing) BLAKE3 hash state of a file chunk
 */
export async function getHashState(stream: Readable, state?: string) {
	return pipeline(stream, async (source) => {
		const blake3 = await createBLAKE3();

		if (state) blake3.load(hexToUint8Array(state));

		for await (const chunk of source) {
			blake3.update(chunk);
		}

		return uint8ArrayToHex(blake3.save());
	});
}

/**
 * Get the final BLAKE3 hash sum from state
 */
export async function getHashFinal(state: string) {
	const blake3 = await createBLAKE3();

	blake3.load(hexToUint8Array(state));

	return blake3.digest();
}
