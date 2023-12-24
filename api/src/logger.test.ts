// import { REDACTED_TEXT } from '@directus/utils';
// import http from 'node:http';
// import type { AddressInfo } from 'node:net';
// import { Writable } from 'node:stream';
// import { pino } from 'pino';
// import { pinoHttp, type HttpLogger } from 'pino-http';
// import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
// import { useEnv } from './env.js';

// const REFRESH_TOKEN_COOKIE_NAME = 'directus_refresh_token';

// // This is required because logger uses global env which is imported before the tests run. Can be
// // reduce to just mock the file when logger is also using useLogger everywhere @TODO
// vi.mock('./env.js', () => ({
// 	useEnv: vi.fn().mockReturnValue({
// 		AUTH_PROVIDERS: 'ranger,monospace',
// 		AUTH_RANGER_DRIVER: 'oauth2',
// 		AUTH_MONOSPACE_DRIVER: 'openid',
// 		REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',
// 		LOG_LEVEL: 'info',
// 		LOG_STYLE: 'raw',
// 		LOG_HTTP_IGNORE_PATHS: '/server/ping',
// 	}),
// }));

// const logOutput = vi.fn();

// let stream: Writable;

// beforeEach(() => {
// 	stream = new Writable({
// 		write(chunk) {
// 			logOutput(JSON.parse(chunk.toString()));
// 		},
// 	});

// 	vi.mocked(useEnv).mockReturnValue({
// 		AUTH_PROVIDERS: 'ranger,monospace',
// 		AUTH_RANGER_DRIVER: 'oauth2',
// 		AUTH_MONOSPACE_DRIVER: 'openid',
// 		REFRESH_TOKEN_COOKIE_NAME,
// 		LOG_LEVEL: 'info',
// 		LOG_STYLE: 'raw',
// 	});
// });

// afterEach(() => {
// 	vi.clearAllMocks();
// });

// describe('req.headers.authorization', () => {
// 	test('Should redact bearer token in Authorization header', () => {
// 		const instance = pino(httpLoggerOptions, stream);

// 		instance.info({
// 			req: {
// 				headers: {
// 					authorization: `Bearer test-access-token-value`,
// 				},
// 			},
// 		});

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			req: {
// 				headers: {
// 					authorization: REDACTED_TEXT,
// 				},
// 			},
// 		});
// 	});
// });

// describe('req.headers.cookie', () => {
// 	test('Should redact refresh token when there is only one entry', () => {
// 		const instance = pino(httpLoggerOptions, stream);

// 		instance.info({
// 			req: {
// 				headers: {
// 					cookie: `${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value`,
// 				},
// 			},
// 		});

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			req: {
// 				headers: {
// 					cookie: REDACTED_TEXT,
// 				},
// 			},
// 		});
// 	});

// 	test('Should redact refresh token with multiple entries', () => {
// 		const instance = pino(httpLoggerOptions, stream);

// 		instance.info({
// 			req: {
// 				headers: {
// 					cookie: `custom_test_cookie=custom_test_value; access_token=test-access-token-value; oauth2.ranger=test-oauth2-value; openid.monospace=test-openid-value; ${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value`,
// 				},
// 			},
// 		});

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			req: {
// 				headers: {
// 					cookie: REDACTED_TEXT,
// 				},
// 			},
// 		});
// 	});
// });

// describe('res.headers', () => {
// 	test('Should redact refresh token when there is only one entry', () => {
// 		const instance = pino(httpLoggerOptions, stream);

// 		instance.info({
// 			res: {
// 				headers: {
// 					'set-cookie': `${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
// 				},
// 			},
// 		});

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			res: {
// 				headers: {
// 					'set-cookie': REDACTED_TEXT,
// 				},
// 			},
// 		});
// 	});

// 	test('Should redact refresh token with multiple entries', () => {
// 		const instance = pino(httpLoggerOptions, stream);

// 		instance.info({
// 			res: {
// 				headers: {
// 					'set-cookie': [
// 						`access_token=test-access-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
// 						`oauth2.ranger=test-oauth2-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
// 						`openid.monospace=test-openid-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
// 						`${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
// 					],
// 				},
// 			},
// 		});

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			res: {
// 				headers: {
// 					'set-cookie': REDACTED_TEXT,
// 				},
// 			},
// 		});
// 	});
// });

// describe('ignored paths', () => {
// 	afterEach(() => {
// 		vi.resetModules();
// 	});

// 	const doRequest = (logger: HttpLogger) =>
// 		new Promise((resolve) => {
// 			const server = http.createServer((req, res) => {
// 				logger(req, res);
// 				res.end();
// 			});

// 			server.listen(0, '127.0.0.1', () => {
// 				const address = server.address() as AddressInfo;
// 				const path = '/server/ping';

// 				http.get('http://' + address.address + ':' + address.port + path, () => {
// 					server.close(resolve);
// 				});
// 			});
// 		});

// 	test('should log request with no ignored paths specified', async () => {
// 		const { httpLoggerEnvConfig } = await import('./logger.js');

// 		const logger = pinoHttp({
// 			logger: pino(httpLoggerOptions, stream),
// 			...httpLoggerEnvConfig,
// 		});

// 		await doRequest(logger);

// 		expect(logOutput.mock.calls[0][0]).toMatchObject({
// 			req: {
// 				url: '/server/ping',
// 			},
// 		});
// 	});

// 	/**
// 	 * @TODO
// 	 *
// 	 * Can't currently run this test as the `useEnv` is used globally in the file. Fixing that here
// 	 * would mean reimporting the resetted module every test which is gross. Rather temporarily
// 	 * remove this one and re-enable it once logger has been refactored to the useLogger style
// 	 */
// 	test.todo('should not log request when it matches ignored path', async () => {
// 		vi.mocked(useEnv).mockReturnValue({
// 			AUTH_PROVIDERS: 'ranger,monospace',
// 			AUTH_RANGER_DRIVER: 'oauth2',
// 			AUTH_MONOSPACE_DRIVER: 'openid',
// 			REFRESH_TOKEN_COOKIE_NAME,
// 			LOG_LEVEL: 'info',
// 			LOG_STYLE: 'raw',
// 			LOG_HTTP_IGNORE_PATHS: '/server/ping',
// 		});

// 		const { httpLoggerEnvConfig } = await import('./logger.js');

// 		const logger = pinoHttp({
// 			logger: pino(httpLoggerOptions, stream),
// 			...httpLoggerEnvConfig,
// 		});

// 		await doRequest(logger);

// 		expect(logOutput).not.toHaveBeenCalled();
// 	});
// });
