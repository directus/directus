import type { Readable } from 'node:stream';

export const readableStreamToString = async (stream: Readable): Promise<string> => {
	const chunks = [];

	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk));
	}

	return Buffer.concat(chunks).toString('utf8');
};
