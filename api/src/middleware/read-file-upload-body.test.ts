import { Readable } from 'node:stream';
import { InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readMultipartFile } from '../utils/read-multipart-file.js';
import readFileUploadBody from './read-file-upload-body.js';

vi.mock('../utils/read-multipart-file.js', () => ({
	readMultipartFile: vi.fn(),
}));

function makeReq(overrides: Partial<Request> & { contentType?: string; body?: unknown } = {}): Request {
	const { contentType, body, ...rest } = overrides;

	return {
		headers: contentType ? { 'content-type': contentType } : {},
		body,
		is: ((type: string) => (contentType?.includes(type) ? type : false)) as any,
		...rest,
	} as unknown as Request;
}

/** Run the middleware and return the single argument passed to next() (an Error or undefined). */
async function run(req: Request, options = {}): Promise<unknown> {
	const next = vi.fn() as unknown as NextFunction;
	await readFileUploadBody(options)(req, {} as Response, next);
	expect(next).toHaveBeenCalledTimes(1);
	return (next as any).mock.calls[0][0];
}

describe('readFileUploadBody', () => {
	beforeEach(() => {
		vi.mocked(readMultipartFile).mockReset();
	});

	describe('application/json body', () => {
		test('passes a non-empty JSON body through untouched', async () => {
			const req = makeReq({ contentType: 'application/json', body: [{ collection: 'a', items: [] }] });

			const err = await run(req);

			expect(err).toBeUndefined();
			expect(req.body).toEqual([{ collection: 'a', items: [] }]);
			expect(readMultipartFile).not.toHaveBeenCalled();
		});

		test('rejects an empty JSON body', async () => {
			const req = makeReq({ contentType: 'application/json', body: {} });

			expect(await run(req)).toBeInstanceOf(InvalidPayloadError);
		});
	});

	describe('multipart file', () => {
		test('parses an uploaded JSON file into req.body', async () => {
			vi.mocked(readMultipartFile).mockResolvedValue({
				mimetype: 'application/json',
				stream: Readable.from(['[{"collection":"a","items":[]}]']),
			});

			const req = makeReq({ contentType: 'multipart/form-data' });
			const err = await run(req);

			expect(err).toBeUndefined();
			expect(req.body).toEqual([{ collection: 'a', items: [] }]);
		});

		test('rejects invalid JSON', async () => {
			vi.mocked(readMultipartFile).mockResolvedValue({
				mimetype: 'application/json',
				stream: Readable.from(['not json']),
			});

			expect(await run(makeReq({ contentType: 'multipart/form-data' }))).toBeInstanceOf(InvalidPayloadError);
		});

		test('rejects a non-JSON file when allowYaml is not set', async () => {
			const destroy = vi.fn();

			vi.mocked(readMultipartFile).mockResolvedValue({
				mimetype: 'text/yaml',
				stream: Object.assign(Readable.from(['a: 1']), { destroy }) as any,
			});

			const err = await run(makeReq({ contentType: 'multipart/form-data' }));

			expect(err).toBeInstanceOf(UnsupportedMediaTypeError);
			expect(destroy).toHaveBeenCalled();
		});

		test('parses an uploaded YAML file when allowYaml is set', async () => {
			vi.mocked(readMultipartFile).mockResolvedValue({
				mimetype: 'text/yaml',
				stream: Readable.from(['version: 1\nname: test']),
			});

			const req = makeReq({ contentType: 'multipart/form-data' });
			const err = await run(req, { allowYaml: true });

			expect(err).toBeUndefined();
			expect(req.body).toEqual({ version: 1, name: 'test' });
		});
	});
});
