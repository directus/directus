import { promisify } from 'node:util';
import { gunzip as gunzipCallback, gzip as gzipCallback } from 'node:zlib';
import { bufferToUint8Array } from './buffer-to-uint8array.js';

const gzip = promisify(gzipCallback);
const gunzip = promisify(gunzipCallback);

/**
 * Gzip compress a given input Uint8Array
 *
 * @param input Uint8Array to compress
 * @returns Compressed Uint8Array
 */
export const compress = async (input: Uint8Array) => {
	const buffer = await gzip(input);
	return bufferToUint8Array(buffer);
};

/**
 * Gzip decompress a given input Uint8Array
 *
 * @param input Uint8Array to decompress
 * @returns Decompressed Uint8Array
 */
export const decompress = async (input: Uint8Array) => {
	const buffer = await gunzip(input);
	return bufferToUint8Array(buffer);
};
