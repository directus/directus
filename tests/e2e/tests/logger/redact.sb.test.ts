import { sandbox } from '@directus/sandbox';
import { authentication, createDirectus, rest } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { Signal } from '@utils/signal.js';
import { expect, test } from 'vitest';

const all = process.env['ALL'] === 'true';

if (!all)
	test('running two instances', { timeout: 60_000 }, async () => {
		const directus = await sandbox(database, {
			inspect: false,
			silent: true,
			env: {
				LOG_LEVEL: 'debug',
				LOG_STYLE: 'raw',
			},
		});

		const messages = new Signal<string[]>([]);

		directus.logger.onLog((msg) => {
			messages.set([...messages.get(), msg]);
		});

		const api = createDirectus(`http://localhost:${directus.apis[0].port}`).with(rest()).with(authentication());

		const login = await api.login({
			email: directus.env.ADMIN_EMAIL,
			password: directus.env.ADMIN_PASSWORD,
		});

		const loginMsg = await messages.waitFor((msgs) => msgs.find((msg) => msg.includes('/auth/login')));
		const loginData = JSON.parse(loginMsg ?? '{}');

		expect(loginData.res.headers['set-cookie']).toBe('--redacted--');

		// TODO, look into why refresh token is not working
		// await api.refresh({ refresh_token: login.access_token! });

		// const refreshMsg = await messages.waitFor((msgs) => msgs.find((msg) => msg.includes('/auth/refresh')));
		// const refreshData = JSON.parse(refreshMsg ?? '{}');

		// console.log(refreshData);  n

		// expect(refreshData.res.headers['set-cookie']).toBe('--redacted--');
	});
