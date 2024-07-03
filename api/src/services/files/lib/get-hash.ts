import { createHash } from 'crypto';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * Get the sha256 hash sum of a file
 */
export async function getHash(stream: Readable) {
	const hasher = createHash('sha256');

	await pipeline(stream, hasher);

	return hasher.digest('hex');
}
