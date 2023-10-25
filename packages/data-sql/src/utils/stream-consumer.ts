import { ReadableStream } from 'node:stream/web';

/**
 * Receives all the chunks from a stream until it's empty.
 *
 * @param readableStream the stream to be consumed
 * @returns all the data from a stream
 */
export async function loadAllResultIntoMemory(
	readableStream: ReadableStream<Record<string, any>>
): Promise<Record<string, any>[]> {
	const actualResult: Record<string, any>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);
	}

	return actualResult;
}
