import { Transport } from '../../src/base/transport';
import { TransportResponse, TransportError } from '../../src/transport';
import { describe, expect, it, vi } from 'vitest';
import { mockServer, URL } from '../utils';
import { rest } from 'msw';

describe('default transport', function () {
	function expectResponse<T extends any[]>(response: TransportResponse<T>, expected: Partial<TransportResponse<T>>) {
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

			mockServer.use(rest[method](URL + route, (_req, res, ctx) => res(ctx.status(200))));

			const transport = new Transport({ url: URL }) as any;
			const response = await transport[method](route);

			expectResponse(response, {
				status: 200,
			});
		});

		it(`${method} should throw on response errors`, async function () {
			const route = `/${method}/500`;
			mockServer.use(rest[method](URL + route, (_req, res, ctx) => res(ctx.status(500))));

			const transport = new Transport({ url: URL }) as any;

			try {
				await expect(transport[method](route)).rejects.toThrowError();
			} catch (err: any) {
				expect(err).toBeInstanceOf(TransportError);
			}
		});

		it(`${method} should carry response error information`, async function () {
			const route = `/${method}/403/error`;

			mockServer.use(
				rest[method](URL + route, (_req, res, ctx) =>
					res(
						ctx.status(403),
						ctx.json({
							errors: [
								{
									message: 'You don\'t have permission access to "contacts" collection.',
									extensions: {
										code: 'FORBIDDEN',
									},
								},
							],
						})
					)
				)
			);

			const transport = new Transport({ url: URL }) as any;

			try {
				await expect(transport[method](route)).rejects.toThrowError();
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

		// I am unsure how to mock this with msw
		// it('get should throw non response errors', async function () {
		// 	const route = `/${method}/this/raises/error`;
		// 	mockServer.use(rest[method](URL + route, (_req, res, ctx) => res(ctx.status(500))));

		// 	const transport = new Transport({ url: URL }) as any;
		// 	let failed = false;

		// 	try {
		// 		await transport[method](route);
		// 		failed = true;
		// 	} catch (err: any) {
		// 		const terr = err as TransportError;
		// 		expect(terr).toBeInstanceOf(TransportError);
		// 		expect(terr.response).toBeUndefined();
		// 		expect(terr.message).toBe('Random error');
		// 		expect(terr.parent).not.toBeUndefined();
		// 		expect(terr.parent?.message).toBe('Random error');
		// 	}

		// 	expect(failed).toBe(false);
		// });
	});

	it('returns the configured url', async function () {
		const transport = new Transport({ url: URL });
		expect(transport.url).toBe(URL);
	});

	it('non axios errors are set in parent', async function () {
		const transport = new Transport({ url: URL });
		const mock = vi.spyOn(transport, 'beforeRequest');

		mock.mockImplementation(() => {
			throw new Error('this is not an axios error');
		});

		try {
			await expect(transport.get('/route')).rejects.toThrowError();
		} catch (err: any) {
			const terr = err as TransportError;
			expect(terr).toBeInstanceOf(TransportError);
			expect(terr.response).toBeUndefined();
			expect(terr.message).toBe('this is not an axios error');
			expect(terr.parent).not.toBeUndefined();
			expect(terr.parent?.message).toBe('this is not an axios error');
		}
	});
});
