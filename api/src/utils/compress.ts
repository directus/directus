import { compress as compressSnappy, uncompress as uncompressSnappy } from 'snappy';
import { compress as compressJSON, decompress as decompressJSON } from '@directus/shared/utils';

export async function compress(raw: Record<string, any> | Record<string, any>[]): Promise<Buffer> {
	if (!raw) return raw;
	return await compressSnappy(compressJSON(raw));
}

export async function decompress(compressed: Buffer): Promise<any> {
	if (!compressed) return compressed;
	return decompressJSON((await uncompressSnappy(compressed, { asBuffer: false })) as string);
}
