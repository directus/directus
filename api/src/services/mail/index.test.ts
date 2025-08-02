import { InvalidPayloadError } from '@directus/errors';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock all the dependencies
vi.mock('../../database/index.js', () => ({
	default: vi.fn().mockReturnValue({}),
}));

vi.mock('../../mailer.js', () => ({
	default: vi.fn().mockReturnValue({
		verify: vi.fn(),
		sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
	}),
}));

vi.mock('../../emitter.js', () => ({
	default: {
		emitFilter: vi.fn(),
	},
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_VERIFY_SETUP: false,
		EMAIL_FROM: 'test@example.com',
		EMAIL_TEMPLATES_PATH: './templates',
		PUBLIC_URL: 'http://localhost',
	}),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		warn: vi.fn(),
	}),
}));

vi.mock('fs-extra', () => ({
	default: {
		pathExists: vi.fn().mockResolvedValue(true),
		readFile: vi.fn().mockResolvedValue('<html>{{projectName}}</html>'),
	},
}));

// Import after mocking
import emitter from '../../emitter.js';
import getMailer from '../../mailer.js';
import type { AbstractServiceOptions } from '../../types/index.js';
import { MailService } from './index.js';

describe('MailService', () => {
	let service: MailService;

	const mockServiceOptions: AbstractServiceOptions = {
		schema: {} as any,
		accountability: null,
		knex: vi.mocked(knex({ client: MockClient })),
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock getDefaultTemplateData
		vi.spyOn(MailService.prototype as any, 'getDefaultTemplateData').mockResolvedValue({
			projectName: 'Test Project',
			projectColor: '#000000',
			projectLogo: 'logo.png',
			projectUrl: 'http://localhost',
		});

		service = new MailService(mockServiceOptions);
	});

	describe('send method - from object validation', () => {
		test('Accepts valid from object with name and address', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { name: 'Test Sender', address: 'sender@example.com' },
			});

			await service.send({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { name: 'Test Sender', address: 'sender@example.com' },
			});

			expect(vi.mocked(getMailer)().sendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: { name: 'Test Sender', address: 'sender@example.com' },
				}),
			);
		});

		test('Throws InvalidPayloadError when from object missing name', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { address: 'sender@example.com' },
			});

			await expect(
				service.send({
					to: 'recipient@example.com',
					subject: 'Test',
					from: { address: 'sender@example.com' } as any,
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(vi.mocked(getMailer)().sendMail).not.toHaveBeenCalled();
		});

		test('Throws InvalidPayloadError when from object missing address', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { name: 'Test Sender' },
			});

			await expect(
				service.send({
					to: 'recipient@example.com',
					subject: 'Test',
					from: { name: 'Test Sender' } as any,
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(vi.mocked(getMailer)().sendMail).not.toHaveBeenCalled();
		});

		test('Throws InvalidPayloadError when from object has empty name', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { name: '', address: 'sender@example.com' },
			});

			await expect(
				service.send({
					to: 'recipient@example.com',
					subject: 'Test',
					from: { name: '', address: 'sender@example.com' },
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(vi.mocked(getMailer)().sendMail).not.toHaveBeenCalled();
		});

		test('Throws InvalidPayloadError when from object has empty address', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: { name: 'Test Sender', address: '' },
			});

			await expect(
				service.send({
					to: 'recipient@example.com',
					subject: 'Test',
					from: { name: 'Test Sender', address: '' },
				}),
			).rejects.toThrow(InvalidPayloadError);

			expect(vi.mocked(getMailer)().sendMail).not.toHaveBeenCalled();
		});

		test('Handles string from value correctly', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: 'sender@example.com',
			});

			await service.send({
				to: 'recipient@example.com',
				subject: 'Test',
				from: 'sender@example.com',
			});

			expect(vi.mocked(getMailer)().sendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: {
						name: 'Test Project',
						address: 'sender@example.com',
					},
				}),
			);
		});

		test('Handles null from object correctly', async () => {
			vi.mocked(emitter.emitFilter).mockResolvedValue({
				to: 'recipient@example.com',
				subject: 'Test',
				from: null,
			});

			await service.send({
				to: 'recipient@example.com',
				subject: 'Test',
				from: null as any,
			});

			expect(vi.mocked(getMailer)().sendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: {
						name: 'Test Project',
						address: 'test@example.com',
					},
				}),
			);
		});
	});
});
