/**
 * @jest-environment node
 */

import nock from 'nock';
import { MemoryStorage } from '../../../src';

import { AxiosTransport } from '../../../src/base/transport/axios-transport';
import { TransportResponse, TransportError } from '../../../src/transport';

describe('axios transport', function () {
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
			const transport = new AxiosTransport(URL, storage) as any;
			const response = await transport[method](route);
			expectResponse(response, {
				status: 200,
			});
		});

		it(`${method} should throw on response errors`, async function () {
			const route = `/${method}/500`;
			(nock(URL) as any)[method](route).reply(500);

			const storage = new MemoryStorage();
			const transport = new AxiosTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err) {
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
			const transport = new AxiosTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err) {
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
			const transport = new AxiosTransport(URL, storage) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err) {
				const terr = err as TransportError;
				expect(terr).toBeInstanceOf(TransportError);
				expect(terr.response).toBeUndefined();
				expect(terr.message).toBe('Random error');
				expect(terr.parent).not.toBeUndefined();
				expect(terr.parent?.message).toBe('Random error');
			}
		});
	});

	it('returns the configured url', async function () {
		const storage = new MemoryStorage();
		const transport = new AxiosTransport(URL, storage);
		expect(transport.url).toBe(URL);
	});

	it('non axios errors are set in parent', async function () {
		const storage = new MemoryStorage();
		const transport = new AxiosTransport(URL, storage);
		const mock = jest.spyOn(transport.axios, 'request');
		mock.mockImplementation(() => {
			throw new Error('this is not an axios error');
		});

		try {
			await transport.get('/route');
			fail();
		} catch (err) {
			const terr = err as TransportError;
			expect(terr).toBeInstanceOf(TransportError);
			expect(terr.response).toBeUndefined();
			expect(terr.message).toBe('this is not an axios error');
			expect(terr.parent).not.toBeUndefined();
			expect(terr.parent?.message).toBe('this is not an axios error');
		}
	});

	it("undefined or unset token doesn't set auth header", async function () {
		nock(URL)
			.get('/auth')
			.times(3)
			.reply(203, function () {
				return {
					data: {
						auth: this.req.headers?.authorization || false,
					},
				};
			});

		const storage = new MemoryStorage();
		const transport = new AxiosTransport(URL, storage);

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
				return {
					data: {
						auth: this.req.headers?.authorization || false,
					},
				};
			});

		const storage = new MemoryStorage();
		const transport = new AxiosTransport(URL, storage);

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
