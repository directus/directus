import type { Readable } from 'node:stream';

export const isReadableStream = (input: any): input is Readable => {
	return (
		input !== null &&
		typeof input === 'object' &&
		typeof input.pipe === 'function' &&
		typeof input._read === 'function' &&
		typeof input._readableState === 'object' &&
		input.readable !== false
	);
};
