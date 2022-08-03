import zlib from 'node:zlib';
import { promisify } from 'node:util';

const compressData = promisify(zlib.gzip);
const decompressData = promisify(zlib.gunzip);

export async function compress(raw: any): Promise<Buffer> {
	if (!raw) return raw;

	const stringed = JSON.stringify(raw);
	const compressed = await compressData(stringed);
	return compressed;
}

export async function decompress(compressed: Buffer): Promise<any> {
	if (!compressed) return compressed;

	const stringed = String(await decompressData(compressed));
	const decompressed = JSON.parse(stringed);
	return decompressed;
}
