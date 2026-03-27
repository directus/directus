import { PassThrough } from 'stream';
import { expect, test } from 'vite-plus/test';
import { destroyPipedStream } from './destroy-piped-stream.js';

test('destroy target stream without destroying source stream', () => {
	const targetWritten: string[] = [];

	const targetStream = new PassThrough();

	targetStream.on('data', (chunk) => {
		targetWritten.push(chunk.toString());
	});

	const sourceStream = new PassThrough();

	sourceStream.pipe(targetStream);

	sourceStream.push('a');
	sourceStream.push('b');

	expect(targetWritten).toEqual(['a', 'b']);

	expect(sourceStream.isPaused()).toBeFalsy();

	destroyPipedStream(targetStream, sourceStream);

	sourceStream.push('c');

	expect(targetWritten).toEqual(['a', 'b']);
	expect(targetStream.destroyed).toBeTruthy();
	expect(sourceStream.destroyed).toBeFalsy();
	expect(sourceStream.isPaused()).toBeFalsy();
});
