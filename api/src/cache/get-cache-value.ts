import type Keyv from 'keyv';
import { decompress } from '../utils/compress.js';

export async function getCacheValue(cache: Keyv, key: string): Promise<any> {
	const value = await cache.get(key);
	if (!value) return undefined;
	const decompressed = await decompress(value);
	return decompressed;
}
