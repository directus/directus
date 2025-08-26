import {
	authentication,
	createDirectus,
	createUser,
	passwordRequest,
	passwordReset,
	readMe,
	rest,
	staticToken,
} from '@directus/sdk';
import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';
import { useEnv } from '../../utils/useEnv';
import { useOptions } from '../../utils/useOptions';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const options = useOptions();

test('auth with token', async () => {
	const token = randomUUID();

	const user = await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email: `${randomUUID()}@test.com`,
			password: 'secret',
			token,
		}),
	);

	const auth = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken(token));

	const me = await auth.request(readMe());

	expect(user.id).toBe(me.id);
});

test('auth with email & password', async () => {
	const email = `${randomUUID()}@test.com`;

	const user = await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email,
			password: 'secret',
		}),
	);

	const auth = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(authentication());

	await auth.login({
		email,
		password: 'secret',
	});

	const me = await auth.request(readMe());

	expect(user.id).toBe(me.id);
});

type Email = {
	html: string;
	headers: Record<string, any>;
	from: {
		address: string;
		name: string;
	}[];
	to: {
		address: string;
		name: string;
	}[];
};

if (options.extras?.maildev) {
	test('resetting passwort via email', async () => {
		const env = useEnv();
		const email = `${randomUUID()}@test.com`;

		await api.request(
			createUser({
				first_name: 'Test',
				last_name: 'User',
				email,
				password: 'secret',
			}),
		);

		const auth = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(authentication());

		await auth.login({
			email,
			password: 'secret',
		});

		await auth.request(passwordRequest(email));

		const mailResponse = await fetch(`http://localhost:${env.MAILDEV_WEBUI}/email`);

		const mails: Email[] = await mailResponse.json();

		const resetMail = mails.find((mail) => mail.to[0].address === email);

		expect(resetMail).toBeDefined();

		const token = resetMail!.html.match(/href=".*token=(.*)"/)![1];

		expect(token).toBeDefined();

		await auth.request(passwordReset(token, 'changedSecret'));

		await expect(async () =>
			auth.login({
				email,
				password: 'secret',
			}),
		).rejects.toThrowError();

		const successfulLogin = await auth.login({
			email,
			password: 'changedSecret',
		});

		expect(successfulLogin).toBeDefined();
	});
}
