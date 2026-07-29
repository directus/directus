import { Readable } from 'node:stream';
import { ContentTooLargeError, InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import { readableStreamToString } from '@directus/utils/node';
import type { Request } from 'express';
import { describe, expect, test } from 'vitest';
import { readMultipartFile } from './read-multipart-file.js';

const BOUNDARY = 'testboundary';

interface Part {
	name?: string;
	filename?: string;
	contentType?: string;
	content: string;
}

/** Build a raw multipart/form-data body from the given file parts. */
function buildMultipartBody(parts: Part[]): Buffer {
	const chunks: string[] = [];

	for (const part of parts) {
		const name = part.name ?? 'file';
		const filename = part.filename ?? 'data.json';
		const contentType = part.contentType ?? 'application/json';

		chunks.push(
			`--${BOUNDARY}\r\n` +
				`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
				`Content-Type: ${contentType}\r\n\r\n` +
				`${part.content}\r\n`,
		);
	}

	chunks.push(`--${BOUNDARY}--\r\n`);

	return Buffer.from(chunks.join(''));
}

/** Minimal Express-request stand-in backed by a Readable so it can be piped into busboy. */
function makeMultipartReq(body: Buffer, contentType = `multipart/form-data; boundary=${BOUNDARY}`): Request {
	const req = Readable.from([body]) as unknown as Request & { headers: Record<string, string> };
	req.headers = { 'content-type': contentType };

	req.is = ((type: string) =>
		type === 'multipart/form-data' && contentType.includes('multipart') ? type : false) as any;

	return req;
}

describe('readMultipartFile', () => {
	test('rejects a non-multipart request with UnsupportedMediaTypeError', async () => {
		const req = Readable.from([Buffer.from('{}')]) as unknown as Request & { headers: Record<string, string> };
		req.headers = { 'content-type': 'application/json' };
		req.is = (() => false) as any;

		await expect(readMultipartFile(req)).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
	});

	test('extracts the first uploaded file as a stream with its mimetype', async () => {
		const body = buildMultipartBody([{ content: '{"hello":"world"}', contentType: 'application/json' }]);

		const { mimetype, stream } = await readMultipartFile(makeMultipartReq(body));

		expect(mimetype).toBe('application/json');
		expect(await readableStreamToString(stream)).toBe('{"hello":"world"}');
	});

	test('rejects with InvalidPayloadError when no file is included', async () => {
		const req = makeMultipartReq(Buffer.from(`--${BOUNDARY}--\r\n`));

		await expect(readMultipartFile(req)).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	test('returns only the first file when multiple are uploaded (limits.files)', async () => {
		const body = buildMultipartBody([
			{ filename: 'first.json', content: '"first"' },
			{ filename: 'second.json', content: '"second"' },
		]);

		const { stream } = await readMultipartFile(makeMultipartReq(body));

		expect(await readableStreamToString(stream)).toBe('"first"');
	});

	test('destroys the file stream with ContentTooLargeError when it exceeds maxFileSize', async () => {
		// Deliver the header and the oversized body in separate ticks so busboy emits `file` (and we
		// attach the consumer) before the `limit` fires, mirroring how a socket delivers a real request.
		const header =
			`--${BOUNDARY}\r\n` +
			`Content-Disposition: form-data; name="file"; filename="data.json"\r\n` +
			`Content-Type: application/json\r\n\r\n`;

		async function* chunks() {
			yield Buffer.from(header);
			await new Promise((resolve) => setImmediate(resolve));
			yield Buffer.from('x'.repeat(1000));
			yield Buffer.from(`\r\n--${BOUNDARY}--\r\n`);
		}

		const req = Readable.from(chunks()) as unknown as Request & { headers: Record<string, string> };
		req.headers = { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` };
		req.is = ((type: string) => (type === 'multipart/form-data' ? type : false)) as any;

		const { stream } = await readMultipartFile(req, { maxFileSize: 10 });

		await expect(readableStreamToString(stream)).rejects.toBeInstanceOf(ContentTooLargeError);
	});
});
