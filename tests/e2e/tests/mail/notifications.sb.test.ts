import { randomUUID } from 'node:crypto';
import { sandbox } from '@directus/sandbox';
import { createDirectus, createNotifications, createUser, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, expect, test } from 'vitest';

const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'mail',
	extras: { maildev: true },
	env: { DB_FILENAME: `directus_test_${getUID()}.db` },
	docker: { suffix: getUID() },
});

const api = createDirectus<any>(`http://localhost:${directus.apis[0]!.port}`).with(rest()).with(staticToken('admin'));

const maildev = `http://127.0.0.1:${directus.env.MAILDEV_WEBUI}`;

afterAll(async () => {
	await directus.stop();
});

/** Polls maildev until `count` messages addressed to `email` have arrived. */
async function waitForMail(email: string, count: number, timeout = 20_000) {
	const deadline = Date.now() + timeout;

	while (Date.now() < deadline) {
		const messages = (await (await fetch(`${maildev}/email`)).json()) as any[];

		const matching = messages.filter((message) => message.to?.some((to: any) => to.address === email));

		if (matching.length >= count) return matching;

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error(`Timed out waiting for ${count} messages to ${email}`);
}

test('creating notifications sends one email per notification', async () => {
	const email = `${randomUUID()}@notifications.example.com`;

	const user = await api.request(
		createUser({ first_name: 'Notified', last_name: 'User', email, password: 'secret' } as any),
	);

	const created = await api.request(
		createNotifications([
			{ recipient: user.id, subject: 'inbox', message: 'Lorem Ipsum' },
			{ recipient: user.id, subject: 'inbox', message: 'Dolor Sat' },
		] as any),
	);

	expect(created).toHaveLength(2);

	const messages = await waitForMail(email, 2);

	expect(messages).toHaveLength(2);
	expect(messages.map((message) => message.subject)).toEqual(['inbox', 'inbox']);
});

test('no email is sent to a user who turned email notifications off', async () => {
	const email = `${randomUUID()}@notifications.example.com`;

	const user = await api.request(
		createUser({
			first_name: 'Quiet',
			last_name: 'User',
			email,
			password: 'secret',
			email_notifications: false,
		} as any),
	);

	await api.request(createNotifications([{ recipient: user.id, subject: 'inbox', message: 'Silence' }] as any));

	await expect(waitForMail(email, 1, 3_000)).rejects.toThrowError();
});
