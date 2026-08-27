import { beforeEach, describe, expect, test, vi } from 'vitest';


vi.mock('@directus/env');
const mockUseEnv = vi.fn();
vi.mocked(await import('@directus/env')).useEnv = mockUseEnv;

const mockLogger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('./logger/index.js', () => ({ useLogger: () => mockLogger }));

// getMailer's job is to turn env vars into transport options, so the assertions below are all on
// what it hands over. Stubbing createRequire keeps the optional transport packages out of the way.
const mockRequire = vi.hoisted(() => vi.fn());
vi.mock('node:module', () => ({ createRequire: () => mockRequire }));

const mockCreateTransport = vi.hoisted(() => vi.fn(() => ({ sendMail: vi.fn() })));
vi.mock('nodemailer', () => ({ default: { createTransport: mockCreateTransport } }));

const mockMailtrapTransport = vi.hoisted(() => vi.fn());
const mockMailgunTransport = vi.hoisted(() => vi.fn());
const mockSESv2Client = vi.hoisted(() => vi.fn());

describe('getMailer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		mockRequire.mockImplementation((id: string) => {
			switch (id) {
				case 'mailtrap':
					return { MailtrapTransport: mockMailtrapTransport };
				case 'nodemailer-mailgun-transport':
					return mockMailgunTransport;
				case '@aws-sdk/client-sesv2':
					return { SESv2Client: mockSESv2Client, SendEmailCommand: 'SendEmailCommand' };
				default:
					throw new Error(`Unexpected lazy require of "${id}"`);
			}
		});
	});

	// getMailer caches its transporter at module scope, so every test has to import a fresh copy of
	// the module to build its own — resetModules only affects imports made after it runs.
	async function importMailer(env: Record<string, unknown>) {
		mockUseEnv.mockReturnValue(env);

		const { default: getMailer } = await import('./mailer.js');

		return getMailer;
	}

	async function createMailer(env: Record<string, unknown>) {
		(await importMailer(env))();
	}

	describe('EMAIL_TRANSPORT', () => {
		test('should be matched case-insensitively', async () => {
			await createMailer({ EMAIL_TRANSPORT: 'SendMail' });

			expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ sendmail: true }));
		});

		test('should warn and build nothing when unknown', async () => {
			const getMailer = await importMailer({ EMAIL_TRANSPORT: 'nope' });

			expect(getMailer()).toBeUndefined();
			expect(mockCreateTransport).not.toHaveBeenCalled();
			expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('EMAIL_TRANSPORT'));
		});
	});

	describe('sendmail', () => {
		test.each([
			{
				case: 'the env vars',
				env: { EMAIL_SENDMAIL_PATH: '/custom/sendmail', EMAIL_SENDMAIL_NEW_LINE: 'windows' },
				options: { sendmail: true, newline: 'windows', path: '/custom/sendmail' },
			},
			{
				case: 'its defaults',
				env: {},
				options: { sendmail: true, newline: 'unix', path: '/usr/sbin/sendmail' },
			},
		])('should be configured from $case', async ({ env, options }) => {
			await createMailer({ EMAIL_TRANSPORT: 'sendmail', ...env });

			expect(mockCreateTransport).toHaveBeenCalledWith(options);
		});
	});

	describe('ses', () => {
		test('should build its client from the EMAIL_SES_ prefix', async () => {
			await createMailer({ EMAIL_TRANSPORT: 'ses', EMAIL_SES_REGION: 'us-east-1' });

			expect(mockSESv2Client).toHaveBeenCalledWith({ region: 'us-east-1' });

			expect(mockCreateTransport).toHaveBeenCalledWith({
				SES: { sesClient: expect.any(mockSESv2Client), SendEmailCommand: 'SendEmailCommand' },
			});
		});
	});

	describe('smtp', () => {
		test('should be configured from the SMTP env vars', async () => {
			await createMailer({
				EMAIL_TRANSPORT: 'smtp',
				EMAIL_SMTP_NAME: 'test',
				EMAIL_SMTP_POOL: true,
				EMAIL_SMTP_HOST: '0.0.0.0',
				EMAIL_SMTP_PORT: 2525,
				EMAIL_SMTP_USER: 'me',
				EMAIL_SMTP_PASSWORD: 'safe',
				EMAIL_SMTP_SECURE: true,
				EMAIL_SMTP_IGNORE_TLS: false,
				EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED: false,
			});

			expect(mockCreateTransport).toHaveBeenCalledWith({
				name: 'test',
				pool: true,
				host: '0.0.0.0',
				port: 2525,
				secure: true,
				ignoreTLS: false,
				auth: { user: 'me', pass: 'safe' },
				tls: { rejectUnauthorized: false },
			});
		});

		test('should skip auth when no credentials are given', async () => {
			await createMailer({ EMAIL_TRANSPORT: 'smtp', EMAIL_SMTP_HOST: '0.0.0.0' });

			expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ auth: false }));
		});
	});

	describe('mailgun', () => {
		test('should be configured from the Mailgun env vars', async () => {
			await createMailer({
				EMAIL_TRANSPORT: 'mailgun',
				EMAIL_MAILGUN_API_KEY: 'key',
				EMAIL_MAILGUN_DOMAIN: 'example.com',
			});

			expect(mockMailgunTransport).toHaveBeenCalledWith({
				auth: { api_key: 'key', domain: 'example.com' },
				host: 'api.mailgun.net',
			});
		});
	});

	describe('mailtrap', () => {
		test('should pass the whole EMAIL_MAILTRAP_ prefix on to Mailtrap', async () => {
			await createMailer({
				EMAIL_TRANSPORT: 'mailtrap',
				EMAIL_MAILTRAP_TOKEN: 'test',
				EMAIL_MAILTRAP_SANDBOX: true,
				EMAIL_MAILTRAP_BULK: false,
				EMAIL_MAILTRAP_TEST_INBOX_ID: 12345,
				EMAIL_MAILTRAP_ACCOUNT_ID: 42,
			});

			expect(mockMailtrapTransport).toHaveBeenCalledWith({
				token: 'test',
				sandbox: true,
				bulk: false,
				testInboxId: 12345,
				accountId: 42,
			});

			expect(mockLogger.warn).not.toHaveBeenCalled();
		});

		test('should throw when the token is unset', async () => {
			const getMailer = await importMailer({ EMAIL_TRANSPORT: 'mailtrap' });

			expect(() => getMailer()).toThrow(/EMAIL_MAILTRAP_TOKEN/);
		});
	});
});
