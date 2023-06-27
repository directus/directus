import type Keyv from 'keyv';
import { compress } from '../utils/compress.js';

export async function setCacheValue(
	cache: Keyv,
	key: string,
	value: Record<string, any> | Record<string, any>[],
	ttl?: number
) {
	const compressed = await compress(value);
	await cache.set(key, compressed, ttl);
}
