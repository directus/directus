// @ts-nocheck

jest.mock('../../src/cache');
jest.mock('../../src/database');
jest.mock('../../src/utils/validate-env');

import { multipartHandler } from '../../src/controllers/files';
import { InvalidPayloadException } from '../../src/exceptions/invalid-payload';
import { PassThrough } from 'stream';

import FormData from 'form-data';

describe('multipartHandler', () => {
	it(`Errors out if request doesn't contain any files to upload`, () => {
		const fakeForm = new FormData();

		fakeForm.append('field', 'test');

		const req = {
			headers: fakeForm.getHeaders(),
			is: jest.fn().mockReturnValue(true),
			body: fakeForm.getBuffer(),
			params: {},
			pipe: (input) => stream.pipe(input),
		};

		const stream = new PassThrough();
		stream.push(fakeForm.getBuffer());

		multipartHandler(req, {}, (err) => {
			expect(err.message).toBe('No files where included in the body');
			expect(err).toBeInstanceOf(InvalidPayloadException);
		});
	});
});
