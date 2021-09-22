import { promisify } from 'util';
import { pipeline as nodePipeline } from 'stream';
import Storage from './Storage';

/**
 * Returns a boolean indication if stream param
 * is a readable stream or not.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isReadableStream(stream: any): stream is NodeJS.ReadableStream {
	return (
		stream !== null &&
		typeof stream === 'object' &&
		typeof stream.pipe === 'function' &&
		typeof stream._read === 'function' &&
		typeof stream._readableState === 'object' &&
		stream.readable !== false
	);
}

export const pipeline = promisify(nodePipeline);

export async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
	const chunks: string[] = [];
	stream.setEncoding('utf-8');
	for await (const chunk of stream) {
		chunks.push(chunk as string);
	}
	return chunks.join('');
}

export async function getFlatList(storage: Storage, prefix?: string): Promise<string[]> {
	const result: string[] = [];
	for await (const file of storage.flatList(prefix)) {
		result.push(file.path);
	}
	return result;
}
