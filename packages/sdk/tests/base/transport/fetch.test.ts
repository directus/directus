/**
 * @jest-environment node
 */

import nock from 'nock';
import * as nodeFetch from 'node-fetch';
import { jest } from '@jest/globals';
import { MemoryStorage } from '../../../src';

import { FetchTransport } from '../../../src/base/transport/fetch-transport';
import { TransportResponse, TransportError } from '../../../src/transport';

describe('fetch transport', function () {
	const URL = 'http://localhost';
	nock.disableNetConnect();

	function expectResponse<T>(response: TransportResponse<T>, expected: Partial<TransportResponse<T>>) {
		if (expected.status) {
			expect(response.status).toBe(expected.status);
		}
		if (expected.statusText) {
			expect(response.statusText).toBe(expected.statusText);
		}
		if (expected.data) {
			expect(response.data).toMatchObject<T | T[]>(expected.data);
		}
		if (expected.headers) {
			expect(response.headers).toMatchObject(expected.headers);
		}
	}

	['get', 'delete', 'head', 'options', 'put', 'post', 'patch'].forEach((method) => {
		it(`${method} should return a response object`, async () => {
			const route = `/${method}/response`;
			(nock(URL) as any)[method](route).reply(200);

			const storage = new MemoryStorage();
			const transport = new FetchTransport(URL, storage) as any;
			const response = await transport[method](route);
			expectResponse(response, {
				status: 200,
			});
		});

		it(`${method} should throw on response errors`, async function () {
			const route = `/${method}/500`;
			(nock(URL) as any)[method](route).reply(500);

			const storage = new MemoryStorage();
			const transport = new FetchTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err: any) {
				expect(err).toBeInstanceOf(TransportError);
			}
		});

		it(`${method} should carry response error information`, async function () {
			const route = `/${method}/403/error`;
			(nock(URL) as any)[method](route).reply(403, {
				errors: [
					{
						message: 'You don\'t have permission access to "contacts" collection.',
						extensions: {
							code: 'FORBIDDEN',
						},
					},
				],
			});

			const storage = new MemoryStorage();
			const transport = new FetchTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err: any) {
				const terr = err as TransportError;
				expect(terr).toBeInstanceOf(TransportError);
				expect(terr.response?.status).toBe(403);
				expect(terr.message).toBe('You don\'t have permission access to "contacts" collection.');
				expect(terr.errors.length).toBe(1);
				expect(terr.errors[0]?.message).toBe('You don\'t have permission access to "contacts" collection.');
				expect(terr.errors[0]?.extensions?.code).toBe('FORBIDDEN');
			}
		});

		it('get should throw non response errors', async function () {
			const route = `/${method}/this/raises/error`;
			(nock(URL) as any)[method](route).replyWithError('Random error');

			const storage = new MemoryStorage();
			const transport = new FetchTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err: any) {
				const expectedMessage = `request to http://localhost/${method}/this/raises/error failed, reason: Random error`;

				const terr = err as TransportError;
				expect(terr).toBeInstanceOf(TransportError);
				expect(terr.response).toBeUndefined();
				expect(terr.message).toBe(expectedMessage);
				expect(terr.parent).not.toBeUndefined();
				expect(terr.parent?.message).toBe(expectedMessage);
			}
		});
	});

	it('returns the configured url', async function () {
		const storage = new MemoryStorage();
		const transport = new FetchTransport(URL, storage);
		expect(transport.url).toBe(URL);
	});

	it('non fetch errors are set in parent', async function () {
		const expectedMessage = 'this is not an fetch error';

		const storage = new MemoryStorage();
		const transport = new FetchTransport(URL, storage);
		const mock = jest.spyOn(JSON, 'stringify');
		mock.mockImplementation(() => {
			throw new Error(expectedMessage);
		});

		try {
			await transport.post('/route', {});
			fail();
		} catch (err: any) {
			const terr = err as TransportError;
			expect(terr).toBeInstanceOf(TransportError);
			expect(terr.response).toBeUndefined();
			expect(terr.message).toBe(expectedMessage);
			expect(terr.parent).not.toBeUndefined();
			expect(terr.parent?.message).toBe(expectedMessage);
		}

		mock.mockRestore();
	});

	it("undefined or unset token doesn't set auth header", async function () {
		nock(URL)
			.get('/auth')
			.times(3)
			.reply(203, function () {
				const headers = new nodeFetch.Headers(this.req.headers);

				return {
					data: {
						auth: headers.get('authorization') || false,
					},
				};
			});

		const storage = new MemoryStorage();
		const transport = new FetchTransport(URL, storage);

		storage.auth_token = 'token_value';

		const response1 = await transport.get('/auth');
		expect(response1.data?.auth).toBe('Bearer token_value');

		storage.auth_token = null;
		const response2 = await transport.get('/auth');
		expect(response2.data?.auth).toBe(false);
	});

	it('handles token even if it has Bearer already', async function () {
		nock(URL)
			.get('/auth')
			.times(3)
			.reply(203, function () {
				const headers = new nodeFetch.Headers(this.req.headers);

				return {
					data: {
						auth: headers.get('authorization') || false,
					},
				};
			});

		const storage = new MemoryStorage();
		const transport = new FetchTransport(URL, storage);

		storage.auth_token = 'Bearer token_value';
		const response1 = await transport.get('/auth');
		expect(response1.data?.auth).toBe('Bearer token_value');

		storage.auth_token = 'xyz';
		const response2 = await transport.get('/auth');
		expect(response2.data?.auth).toBe('Bearer xyz');

		storage.auth_token = null;
		const response3 = await transport.get('/auth');
		expect(response3.data?.auth).toBe(false);
	});
});
