import { Database, sandbox } from '@directus/sandbox';
import { authentication, createDirectus, rest } from '@directus/sdk';
import { expect, test } from 'vitest';
import { Signal } from '../../utils/signal';

const database = process.env['DATABASE'] as Database;
const all = process.env['ALL'] === 'true';

if (!all)
	test('running two instances', { timeout: 60_000 }, async () => {
		const directus = await sandbox(database, {
			port: String(Math.floor(Math.random() * 400 + 10000)),
			killPorts: true,
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

		const api = createDirectus(`http://localhost:${directus.env.PORT}`).with(rest()).with(authentication());

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
