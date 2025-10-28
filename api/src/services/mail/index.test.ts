import { InvalidPayloadError } from '@directus/errors';
import type { AbstractServiceOptions } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import getMailer from '../../mailer.js';
import { MailService } from './index.js';

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

describe('MailService', () => {
	let service: MailService;

	const mockServiceOptions: AbstractServiceOptions = {
		schema: {} as any,
		accountability: null,
		knex: vi.mocked(knex({ client: MockClient })),
	};

	beforeEach(() => {
		vi.clearAllMocks();

		vi.spyOn(MailService.prototype as any, 'getDefaultTemplateData').mockResolvedValue({
			projectName: 'Test Project',
			projectColor: '#000000',
			projectLogo: 'logo.png',
			projectUrl: 'http://localhost',
		});

		service = new MailService(mockServiceOptions);
	});

	describe('send', () => {
		test('should accept from object with name + address', async () => {
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

		test('should throw an InvalidPayloadError if from is missing a name property', async () => {
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

		test('should throw an InvalidPayloadError if from is missing an email property', async () => {
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

		test('should throw an InvalidPayloadError if from has an empty name', async () => {
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

		test('should throw an InvalidPayloadError if from object has an empty address', async () => {
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

		test('should accept from as a string', async () => {
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
	});
});
