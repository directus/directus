/**
 * @jest-environment node
 */

import nock from 'nock';

import { AxiosTransport } from '../../../src/core/transport/axios';
import { Response, TransportError } from '../../../src/shared/transport';

describe('axios transport', function () {
	const URL = 'http://localhost';
	nock.disableNetConnect();

	function expectResponse<T>(response: Response<T>, expected: Partial<Response<T>>) {
		if (expected.status) {
			expect(response.status).toBe(expected.status);
		}
		if (expected.statusText) {
			expect(response.statusText).toBe(expected.statusText);
		}
		if (expected.data) {
			expect(response.data).toMatchObject<T>(expected.data);
		}
		if (expected.headers) {
			expect(response.headers).toMatchObject(expected.headers);
		}
	}

	['get', 'delete', 'head', 'options', 'put', 'post', 'patch'].forEach((method) => {
		it(`${method} should return a response object`, async () => {
			const route = `/${method}/response`;
			(nock(URL) as any)[method](route).reply(200);

			const transport = new AxiosTransport(URL) as any;
			const response = await transport[method](route);
			expectResponse(response, {
				status: 200,
			});
		});

		it(`${method} should throw on response errors`, async function () {
			const route = `/${method}/500`;
			(nock(URL) as any)[method](route).reply(500);

			const transport = new AxiosTransport(URL) as any;
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

			const transport = new AxiosTransport(URL) as any;
			try {
				await transport[method](route);
				fail();
			} catch (err) {
				const terr = err as TransportError;
				expect(terr).toBeInstanceOf(TransportError);
				expect(terr.response!.status).toBe(403);
				expect(terr.message).toBe('You don\'t have permission access to "contacts" collection.');
				expect(terr.errors.length).toBe(1);
				expect(terr.errors[0]!.message).toBe('You don\'t have permission access to "contacts" collection.');
				expect(terr.errors[0]!.extensions?.code).toBe('FORBIDDEN');
			}
		});

		it('get should throw non response errors', async function () {
			const route = `/${method}/this/raises/error`;
			(nock(URL) as any)[method](route).replyWithError('Random error');

			const transport = new AxiosTransport(URL) as any;

			try {
				await transport[method](route);
				fail();
			} catch (err) {
				const terr = err as TransportError;
				expect(terr).toBeInstanceOf(TransportError);
				expect(terr.response).toBeUndefined();
				expect(terr.message).toBe('Random error');
				expect(terr.parent).not.toBeUndefined();
				expect(terr.parent!.message).toBe('Random error');
			}
		});
	});

	it('non axios errors are set in parent', async function () {
		const transport = new AxiosTransport(URL);
		const mock = jest.spyOn(transport.axios, 'get');
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
			expect(terr.parent!.message).toBe('this is not an axios error');
		}
	});

	it('can set and get token', async function () {
		const transport = new AxiosTransport(URL);
		expect(transport.token).toBeNull();

		transport.token = '1234';
		expect(transport.token).toBe('1234');
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

		const transport = new AxiosTransport(URL);

		transport.token = 'token_value';
		const response1 = await transport.get('/auth');
		expect(response1.data?.auth).toBe('Bearer token_value');

		transport.token = null;
		const response2 = await transport.get('/auth');
		expect(response2.data?.auth).toBe(false);

		transport.token = undefined;
		const response3 = await transport.get('/auth');
		expect(response3.data?.auth).toBe(false);
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

		const transport = new AxiosTransport(URL);

		transport.token = 'Bearer token_value';
		const response1 = await transport.get('/auth');
		expect(response1.data?.auth).toBe('Bearer token_value');

		transport.token = 'xyz';
		const response2 = await transport.get('/auth');
		expect(response2.data?.auth).toBe('Bearer xyz');

		transport.token = null;
		const response3 = await transport.get('/auth');
		expect(response3.data?.auth).toBe(false);
	});
});
