import { REDACTED_TEXT } from '@directus/constants';
import { Writable } from 'node:stream';
import { pino } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const REFRESH_TOKEN_COOKIE_NAME = 'directus_refresh_token';

vi.doMock('./env', async () => {
	const MOCK_ENV = {
		AUTH_PROVIDERS: 'ranger,monospace',
		AUTH_RANGER_DRIVER: 'oauth2',
		AUTH_MONOSPACE_DRIVER: 'openid',
		REFRESH_TOKEN_COOKIE_NAME,
		LOG_LEVEL: 'info',
		LOG_STYLE: 'raw',
	};

	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

const { httpLoggerOptions } = await import('./logger.js');

const logOutput = vi.fn();

let stream: Writable;

beforeEach(() => {
	stream = new Writable({
		write(chunk) {
			logOutput(JSON.parse(chunk.toString()));
		},
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('req.headers.authorization', () => {
	test('Should redact bearer token in Authorization header', () => {
		const instance = pino(httpLoggerOptions, stream);

		instance.info({
			req: {
				headers: {
					authorization: `Bearer test-access-token-value`,
				},
			},
		});

		expect(logOutput.mock.calls[0][0]).toMatchObject({
			req: {
				headers: {
					authorization: REDACTED_TEXT,
				},
			},
		});
	});
});

describe('req.headers.cookie', () => {
	test('Should redact refresh token when there is only one entry', () => {
		const instance = pino(httpLoggerOptions, stream);

		instance.info({
			req: {
				headers: {
					cookie: `${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value`,
				},
			},
		});

		expect(logOutput.mock.calls[0][0]).toMatchObject({
			req: {
				headers: {
					cookie: REDACTED_TEXT,
				},
			},
		});
	});

	test('Should redact refresh token with multiple entries', () => {
		const instance = pino(httpLoggerOptions, stream);

		instance.info({
			req: {
				headers: {
					cookie: `custom_test_cookie=custom_test_value; access_token=test-access-token-value; oauth2.ranger=test-oauth2-value; openid.monospace=test-openid-value; ${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value`,
				},
			},
		});

		expect(logOutput.mock.calls[0][0]).toMatchObject({
			req: {
				headers: {
					cookie: REDACTED_TEXT,
				},
			},
		});
	});
});

describe('res.headers', () => {
	test('Should redact refresh token when there is only one entry', () => {
		const instance = pino(httpLoggerOptions, stream);

		instance.info({
			res: {
				headers: {
					'set-cookie': `${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
				},
			},
		});

		expect(logOutput.mock.calls[0][0]).toMatchObject({
			res: {
				headers: {
					'set-cookie': REDACTED_TEXT,
				},
			},
		});
	});

	test('Should redact refresh token with multiple entries', () => {
		const instance = pino(httpLoggerOptions, stream);

		instance.info({
			res: {
				headers: {
					'set-cookie': [
						`access_token=test-access-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
						`oauth2.ranger=test-oauth2-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
						`openid.monospace=test-openid-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
						`${REFRESH_TOKEN_COOKIE_NAME}=test-refresh-token-value; Max-Age=604800; Path=/; Expires=Tue, 14 Feb 2023 12:00:00 GMT; HttpOnly; SameSite=Lax`,
					],
				},
			},
		});

		expect(logOutput.mock.calls[0][0]).toMatchObject({
			res: {
				headers: {
					'set-cookie': REDACTED_TEXT,
				},
			},
		});
	});
});
