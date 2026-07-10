import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import getMailer from './mailer.js';

// Mock the dependencies
vi.mock('@directus/env');
vi.mock('./utils/get-config-from-env.js');

// Mock useEnv
const mockUseEnv = vi.fn();
vi.mocked(await import('@directus/env')).useEnv = mockUseEnv;

// Mock getConfigFromEnv
const mockGetConfigFromEnv = vi.fn();
vi.mocked(await import('./utils/get-config-from-env.js')).getConfigFromEnv = mockGetConfigFromEnv;

describe('getMailer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the module to clear any cached transporter
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should not throw when creating SES transport', () => {
		mockUseEnv.mockReturnValue({
			EMAIL_TRANSPORT: 'ses',
		});

		mockGetConfigFromEnv.mockReturnValue({
			region: 'us-east-1',
			credentials: {
				accessKeyId: 'access',
				secretAccessKey: 'secret',
			},
		});

		expect(() => getMailer()).not.toThrow();
	});

	test('should not throw when creating sendmail transport', () => {
		mockUseEnv.mockReturnValue({
			EMAIL_TRANSPORT: 'sendmail',
		});

		mockGetConfigFromEnv.mockReturnValue({
			newLine: 'unix',
			path: '/usr/sbin/sendmail',
		});

		expect(() => getMailer()).not.toThrow();
	});

	test('should not throw when creating SMTP transport', () => {
		mockUseEnv.mockReturnValue({
			EMAIL_TRANSPORT: 'smtp',
		});

		mockGetConfigFromEnv.mockReturnValue({
			host: '0.0.0.0',
			port: '123',
			user: 'me',
			password: 'safe',
			name: 'test',
		});

		expect(() => getMailer()).not.toThrow();
	});

	test('should not throw when creating Mailgun transport', () => {
		mockUseEnv.mockReturnValue({
			EMAIL_TRANSPORT: 'mailgun',
		});

		mockGetConfigFromEnv.mockReturnValue({
			apiKey: 'test',
			domain: 'test',
			host: 'api.mailgun.net',
		});

		expect(() => getMailer()).not.toThrow();
	});

	test('should not throw when creating Mailtrap transport', async () => {
		// Re-import getMailer so it runs against a fresh module (the transporter is
		// cached at module scope, and beforeEach's resetModules only affects fresh
		// imports, not the statically imported getMailer used by the tests above).
		// Without this, the cached transporter short-circuits the mailtrap branch.
		const { useEnv } = await import('@directus/env');

		vi.mocked(useEnv).mockReturnValue({
			EMAIL_TRANSPORT: 'mailtrap',
			EMAIL_MAILTRAP_TOKEN: 'test',
			EMAIL_MAILTRAP_SANDBOX: true,
			EMAIL_MAILTRAP_INBOX_ID: 12345,
		});

		const { default: getFreshMailer } = await import('./mailer.js');

		expect(() => getFreshMailer()).not.toThrow();
	});
});
