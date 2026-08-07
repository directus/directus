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

// Mock useLogger
const mockLogger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('./logger/index.js', () => ({ useLogger: () => mockLogger }));

describe('getMailer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the module to clear any cached transporter
		vi.resetModules();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// TODO The transport tests below only assert that `getMailer()` does not throw, and they share the
	// statically imported `getMailer`, so the module-scope transporter cached by the first test
	// short-circuits the rest — they never actually exercise their own branch. Each should re-import
	// the module and assert the params of the created transporter, the way the Mailtrap tests do.

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

	type MailtrapTransportInternals = {
		name: string;
		version: string;
		client: {
			axios: { defaults: { headers: Record<string, unknown> } };
			testInboxId?: number;
			accountId?: number;
			organizationId?: number;
			bulk: boolean;
			sandbox: boolean;
			determineHost: () => string;
		};
	};

	const LIVE_ENDPOINT = 'https://send.api.mailtrap.io';
	const BULK_ENDPOINT = 'https://bulk.api.mailtrap.io';
	const SANDBOX_ENDPOINT = 'https://sandbox.api.mailtrap.io';

	// The transporter is cached at module scope, so the module has to be re-imported to build a fresh
	// one — beforeEach's resetModules only affects fresh imports, not the statically imported
	// getMailer used by the tests above.
	async function createMailtrapMailer(env: Record<string, unknown>) {
		mockUseEnv.mockReturnValue({
			EMAIL_TRANSPORT: 'mailtrap',
			EMAIL_MAILTRAP_TOKEN: 'test',
			...env,
		});

		const { default: getFreshMailer } = await import('./mailer.js');

		return getFreshMailer;
	}

	async function createMailtrapTransport(env: Record<string, unknown>) {
		const getFreshMailer = await createMailtrapMailer(env);

		return getFreshMailer().transporter as unknown as MailtrapTransportInternals;
	}

	test('should create the Mailtrap sandbox transport with the expected client config', async () => {
		const transport = await createMailtrapTransport({
			EMAIL_MAILTRAP_SANDBOX: true,
			EMAIL_MAILTRAP_INBOX_ID: 12345,
		});

		expect(transport.name).toBe('MailtrapTransport');
		expect(transport.version).toEqual(expect.any(String));

		expect(transport.client).toMatchObject({
			testInboxId: 12345,
			accountId: undefined,
			organizationId: undefined,
			bulk: false,
			sandbox: true,
		});

		expect(transport.client.determineHost()).toBe(SANDBOX_ENDPOINT);
		expect(transport.client.axios.defaults.headers).toMatchObject({ Authorization: 'Bearer test' });
	});

	test('should send to the live API when neither sandbox nor bulk is configured', async () => {
		const transport = await createMailtrapTransport({});

		expect(transport.client).toMatchObject({ testInboxId: undefined, bulk: false, sandbox: false });
		expect(transport.client.determineHost()).toBe(LIVE_ENDPOINT);
	});

	test('should send to the bulk API when bulk mode is enabled', async () => {
		const transport = await createMailtrapTransport({ EMAIL_MAILTRAP_BULK: true });

		expect(transport.client).toMatchObject({ bulk: true, sandbox: false });
		expect(transport.client.determineHost()).toBe(BULK_ENDPOINT);
	});

	// A non-boolean value means the operator asked for sandbox but gets live sending, so it has to warn
	// rather than fall through silently
	test.each(['true', 1])('should ignore and warn about a non-boolean Mailtrap sandbox value (%s)', async (value) => {
		const transport = await createMailtrapTransport({
			EMAIL_MAILTRAP_SANDBOX: value,
			EMAIL_MAILTRAP_INBOX_ID: 12345,
		});

		expect(transport.client.sandbox).toBe(false);
		expect(transport.client.determineHost()).toBe(LIVE_ENDPOINT);
		expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('EMAIL_MAILTRAP_SANDBOX'));
	});

	test.each([Number.NaN, '12345', 0])(
		'should ignore and warn about an illegal Mailtrap inbox ID (%s)',
		async (value) => {
			const transport = await createMailtrapTransport({ EMAIL_MAILTRAP_INBOX_ID: value });

			expect(transport.client.testInboxId).toBeUndefined();
			expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('EMAIL_MAILTRAP_INBOX_ID'));
		},
	);

	test.each([undefined, Number.NaN, '12345', 0])(
		'should throw when Mailtrap sandbox mode is enabled with an illegal inbox ID (%s)',
		async (value) => {
			const getFreshMailer = await createMailtrapMailer({
				EMAIL_MAILTRAP_SANDBOX: true,
				EMAIL_MAILTRAP_INBOX_ID: value,
			});

			expect(() => getFreshMailer()).toThrow(/EMAIL_MAILTRAP_INBOX_ID/);
		},
	);

	// Mailtrap only rejects this combination at send time, so it has to be caught when the client is built
	test('should throw when Mailtrap bulk and sandbox modes are combined', async () => {
		const getFreshMailer = await createMailtrapMailer({
			EMAIL_MAILTRAP_BULK: true,
			EMAIL_MAILTRAP_SANDBOX: true,
			EMAIL_MAILTRAP_INBOX_ID: 12345,
		});

		expect(() => getFreshMailer()).toThrow(/bulk/i);
	});

	test('should not warn when the Mailtrap flags are explicitly disabled', async () => {
		const transport = await createMailtrapTransport({
			EMAIL_MAILTRAP_SANDBOX: false,
			EMAIL_MAILTRAP_BULK: false,
		});

		expect(transport.client).toMatchObject({ bulk: false, sandbox: false });
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});
});
