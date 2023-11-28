import { ReadableStream } from 'node:stream/web';

/**
 * Receives all the chunks from a stream until it's empty.
 *
 * @param readableStream the stream to be consumed
 * @returns all the data from a stream
 */
export async function readToEnd(
	readableStream: ReadableStream<Record<string, unknown>>,
): Promise<Record<string, unknown>[]> {
	const actualResult: Record<string, unknown>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);
	}

	return actualResult;
}
