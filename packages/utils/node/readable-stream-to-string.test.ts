import { Readable } from 'node:stream';
import { expect, test } from 'vite-plus/test';
import { readableStreamToString } from './readable-stream-to-string.js';

test.each([Readable.from('test', { encoding: 'utf8' }), Readable.from(Buffer.from([0x74, 0x65, 0x73, 0x74]))])(
	'Returns readable stream as string',
	async (readableStream) => {
		await expect(readableStreamToString(readableStream)).resolves.toBe('test');
	},
);
