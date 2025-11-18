import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import { simpleParser, type ParsedMail } from 'mailparser';
import { SMTPServer } from 'smtp-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('Mail', async () => {
	let fakeSMTPServer: SMTPServer;
	let messages: ParsedMail[] = [];

	beforeAll(async () => {
		fakeSMTPServer = new SMTPServer({
			authOptional: true,
			hideSTARTTLS: true,
			onData(stream, _, cb) {
				simpleParser(stream, (err, message) => {
					if (err) {
						return cb();
					}

					messages.push(message);
					cb();
				});
			},
		});

		await new Promise<void>((resolve) =>
			fakeSMTPServer.listen(1025, '127.0.0.1', () => {
				resolve();
			}),
		);
	}, 180_000);

	afterAll(async () => {
		await new Promise<void>((resolve) =>
			fakeSMTPServer.close(() => {
				resolve();
			}),
		);
	});

	beforeEach(() => {
		messages = [];
	});

	describe('POST /notifications', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Setup
			const notifications = [
				{
					recipient: USER.TESTS_FLOW.ID,
					subject: 'inbox',
					message: 'Lorem Ipsum',
				},
				{
					recipient: USER.TESTS_FLOW.ID,
					subject: 'inbox',
					message: 'Dolor Sat',
				},
			];

			// action
			const response = await request(getUrl(vendor))
				.post('/notifications')
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.send(notifications);

			// Checks
			expect(response.status).toEqual(200);

			// wait for mail to arrive
			await sleep(5000);

			expect(messages).toHaveLength(2);
		});
	});
});
